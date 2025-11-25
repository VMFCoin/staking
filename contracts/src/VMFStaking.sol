// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UD60x18, ud} from "../lib/prb-math/src/UD60x18.sol";

/**
 * @title VMFStaking
 * @author anon
 * @notice This contract allows users to stake ERC20 tokens for fixed periods to earn rewards with compound interest.
 * @dev Uses OpenZeppelin Ownable and IERC20, and PRB-Math for fixed-point math.
 */
contract VMFStaking is Ownable {
    // =====================
    // Custom Errors
    // =====================
    /// @notice Invalid staking ID provided
    error VMFStaking__InvalidId();
    /// @notice Invalid token address
    error VMFStaking__InvalidToken();
    /// @notice Invalid staking amount (zero or out of bounds)
    error VMFStaking__InvalidStakeAmount();
    /// @notice No yield available to withdraw yet
    error VMFStaking__NoYieldToWithdrawYet();
    /// @notice Invalid withdrawal amount (zero)
    error VMFStaking__InvalidWithdrawAmount();
    /// @notice Staking period has not ended yet
    error VMFStaking__StakingPeriodYetToEnd();
    /// @notice Staking duration is not a valid multiple
    error VMFStaking__InvalidStakingDuration();
    /// @notice Batch stake parameters mismatch
    error VMFStaking__InvalidStakeBatchParams();
    /// @notice Batch withdraw parameters mismatch
    error VMFStaking__InvalidWithdrawBatchParams();
    /// @notice Insufficient withdrawable balance
    error VMFStaking__InsufficientWithdrawBalance();

    // =====================
    // State Variables
    // =====================
    /// @notice Minimum allowed staking period (in days)
    uint40 private immutable _minimumStakingPeriod;
    /// @notice Minimum APR rate per second (scaled by 1e18)
    uint64 public immutable _minimumAPRRate;
    /// @notice Counter for unique staking IDs
    uint48 private _idCounter = 1;
    /// @notice Minimum amount allowed for staking
    uint112 public minimumStakeCap;
    /// @notice Maximum amount allowed for staking
    uint112 public maximumStakeCap;
    /// @notice ERC20 token used for staking and rewards
    IERC20 private immutable _token;

    // =====================
    // Data Structures
    // =====================
    /**
     * @dev Struct to store staking information for each position
     * @param id Unique staking position ID
     * @param startTime Timestamp when staking started
     * @param stakingPeriod Duration of stake (in days)
     * @param stakedAmount Amount staked
     * @param lastYieldClaimAt Timestamp of last yield claim
     */
    struct StakingInfo {
        uint48 id;
        uint40 startTime;
        uint40 stakingPeriod;
        uint112 stakedAmount;
        uint40 lastYieldClaimAt;
    }

    /// @dev Mapping from user address to staking ID to StakingInfo
    mapping(address => mapping(uint64 => StakingInfo)) public _userStakingInfo;

    // =====================
    // Events
    // =====================
    /**
     * @notice Emitted when a user stakes tokens
     * @param user The address of the user
     * @param id The unique staking position ID
     * @param stakedAmount The amount staked
     * @param stakingPeriod The period of staking (days)
     * @param startTime The timestamp when staking started
     */
    event Stake(
        address indexed user,
        uint256 indexed id,
        uint256 indexed stakedAmount,
        uint256 stakingPeriod,
        uint256 startTime
    );

    /**
     * @notice Emitted when a user withdraws tokens
     * @param user The address of the user
     * @param id The staking position ID
     * @param stakedAmount The original staked amount
     * @param withdrawAmount The amount withdrawn
     * @param stakingPeriod The staking period
     * @param startTime The start time of staking
     * @param endTime The time of withdrawal
     */
    event Withdraw(
        address indexed user,
        uint256 indexed id,
        uint256 stakedAmount,
        uint256 indexed withdrawAmount,
        uint256 stakingPeriod,
        uint256 startTime,
        uint256 endTime
    );

    /**
     * @notice Emitted when a user withdraws yield from their stake
     * @param user Address of the user who withdrew yield
     * @param id Unique identifier of the stake
     * @param stakedAmount Amount of tokens that were staked
     * @param yieldWithdrawalAmount Amount of yield tokens withdrawn
     * @param stakingPeriod Duration of the staking period in seconds
     * @param startTime Timestamp when the stake was initiated
     * @param endTime Timestamp when the stake ends/ended
     */
    event StakeYieldWithdraw(
        address indexed user,
        uint256 indexed id,
        uint256 stakedAmount,
        uint256 indexed yieldWithdrawalAmount,
        uint256 stakingPeriod,
        uint256 startTime,
        uint256 endTime
    );

    // =====================
    // Modifiers
    // =====================
    /**
     * @dev Ensures the staking period for the given ID has ended
     * @param _id Staking position ID
     */
    modifier stakingPeriodEnded(uint64 _id) {
        uint256 startTime = _userStakingInfo[msg.sender][_id].startTime;
        uint256 stakingPeriod = _userStakingInfo[msg.sender][_id].stakingPeriod;
        uint256 timePassed = block.timestamp - startTime;
        if (timePassed < stakingPeriod) {
            revert VMFStaking__StakingPeriodYetToEnd();
        }
        _;
    }

    /**
     * @dev Ensures the staking ID is valid
     * @param _id Staking position ID
     */
    modifier validId(uint48 _id) {
        if (_userStakingInfo[msg.sender][_id].stakedAmount == 0) {
            revert VMFStaking__InvalidId();
        }
        _;
    }

    /**
     * @dev Ensures the staking amount is valid
     * @param amount Amount to stake
     */
    modifier stakeValidAmount(uint256 amount) {
        if (
            amount == 0 || amount < minimumStakeCap || amount > maximumStakeCap
        ) {
            revert VMFStaking__InvalidStakeAmount();
        }
        _;
    }

    /**
     * @dev Ensures the withdrawal amount is valid
     * @param amount Amount to withdraw
     */
    modifier withdrawValidAmount(uint256 amount) {
        if (amount == 0) revert VMFStaking__InvalidWithdrawAmount();
        _;
    }

    /**
     * @dev Ensures the staking period is a valid multiple of the minimum
     * @param stakingPeriod Period to stake (in days)
     */
    modifier validStakingPeriod(uint256 stakingPeriod) {
        if (stakingPeriod < _minimumStakingPeriod) {
            revert VMFStaking__InvalidStakingDuration();
        }
        _;
    }

    // =====================
    // Constructor
    // =====================
    /**
     * @notice Initializes the staking contract
     * @param periodForMinimumRate_ Minimum staking rate (per seconds)
     * @param minimumRate_ Minimum APR rate (scaled by 1e18)
     * @param _minimumStakeCap Minimum allowed stake amount
     * @param _maximumStakeCap Maximum allowed stake amount
     * @param token_ ERC20 token address for staking
     */
    constructor(
        uint40 periodForMinimumRate_,
        uint64 minimumRate_,
        uint112 _minimumStakeCap,
        uint112 _maximumStakeCap,
        IERC20 token_
    ) Ownable(msg.sender) {
        if (address(token_) == address(0)) revert VMFStaking__InvalidToken();
        _minimumStakingPeriod = periodForMinimumRate_;
        _minimumAPRRate = minimumRate_;
        minimumStakeCap = _minimumStakeCap;
        maximumStakeCap = _maximumStakeCap;
        _token = token_;
    }

    // =====================
    // Public Functions
    // =====================
    /**
     * @notice Stake a specified amount of tokens for a given period
     * @param amount Amount to stake
     * @param stakingPeriod Staking period (must be multiple of minimum)
     */
    function stake(
        uint112 amount,
        uint40 stakingPeriod
    ) public stakeValidAmount(amount) validStakingPeriod(stakingPeriod) {
        _stake(amount, stakingPeriod);
    }

    /**
     * @notice Withdraw a specified amount from a staking position
     * @param _id Staking position ID
     * @param _withdrawAmount Amount to withdraw
     */
    function withdraw(
        uint48 _id,
        uint112 _withdrawAmount
    )
        public
        validId(_id)
        withdrawValidAmount(_withdrawAmount)
        stakingPeriodEnded(_id)
    {
        _withdraw(_id, _withdrawAmount);
    }

    // =====================
    // External Functions
    // =====================
    /**
     * @notice Stake multiple amounts for multiple periods in a batch
     * @param amounts Array of amounts to stake
     * @param stakingPeriods Array of staking periods
     */
    function stakeBatch(
        uint112[] calldata amounts,
        uint40[] calldata stakingPeriods
    ) external {
        if (amounts.length != stakingPeriods.length) {
            revert VMFStaking__InvalidStakeBatchParams();
        }
        for (uint256 i = 0; i < amounts.length; i++) {
            stake(amounts[i], stakingPeriods[i]);
        }
    }

    /**
     * @notice Withdraw only the yield (rewards) from a staking position
     * @param _id Staking position ID
     */
    function withdrawYield(uint48 _id) external validId(_id) {
        _withdrawYield(_id);
    }

    /**
     * @notice Extend the staking period for an ended position
     * @param id Staking position ID
     * @param stakingPeriod New staking period
     */
    function extendStakingPeriod(
        uint48 id,
        uint40 stakingPeriod
    )
        external
        validId(id)
        stakingPeriodEnded(id)
        validStakingPeriod(stakingPeriod)
    {
        _extendStakingPeriod(id, stakingPeriod);
    }

    /**
     * @notice Withdraw all tokens from a staking position
     * @param id Staking position ID
     */
    function withdrawAll(
        uint48 id
    ) external validId(id) stakingPeriodEnded(id) {
        _withdrawAll(id);
    }

    /**
     * @notice Withdraw from multiple staking positions in a batch
     * @param ids Array of staking position IDs
     * @param amounts Array of amounts to withdraw
     */
    function withdrawBatch(
        uint48[] calldata ids,
        uint112[] calldata amounts
    ) external {
        if (amounts.length != ids.length) {
            revert VMFStaking__InvalidWithdrawBatchParams();
        }
        for (uint48 i = 0; i < ids.length; i++) {
            withdraw(ids[i], amounts[i]);
        }
    }

    /**
     * @notice Set the minimum stake cap (only owner)
     * @param _newCap New minimum stake cap
     */
    function setMinimumStakeCap(uint112 _newCap) external onlyOwner {
        minimumStakeCap = _newCap;
    }

    /**
     * @notice Set the maximum stake cap (only owner)
     * @param _newCap New maximum stake cap
     */
    function setMaximumStakeCap(uint112 _newCap) external onlyOwner {
        maximumStakeCap = _newCap;
    }

    // =====================
    // External View Functions
    // =====================
    /**
     * @notice Returns the withdrawable amount for a staking position
     * @param _id Staking position ID
     */
    function getWithdrawableAmount(
        uint48 _id,
        address _user
    ) external view returns (uint256) {
        if (_userStakingInfo[_user][_id].stakedAmount == 0) {
            revert VMFStaking__InvalidId();
        }
        StakingInfo storage stakingInfo = _userStakingInfo[_user][_id];

        // Time passed since staking began
        uint256 timePassed = block.timestamp - stakingInfo.lastYieldClaimAt;

        // Calculate the final amount if the staking period has ended
        uint256 amountWhenStakingPeriodEnds = calculateCompound(
            _minimumAPRRate,
            stakingInfo.stakedAmount,
            timePassed
        );

        return amountWhenStakingPeriodEnds;
    }

    /**
     * @notice Returns the minimum APR rate
     */
    function minimumRate() external view returns (uint256) {
        return _minimumAPRRate;
    }

    /**
     * @notice Returns the staking token address
     */
    function token() external view returns (IERC20) {
        return _token;
    }

    /**
     * @notice Returns the current staking ID counter
     */
    function idCounter() external view returns (uint256) {
        return _idCounter;
    }

    /**
     * @notice Returns staking info for a user and staking ID
     * @param _user User address
     * @param _stakingId Staking position ID
     */
    function getUserStakingInfo(
        address _user,
        uint48 _stakingId
    ) external view returns (StakingInfo memory) {
        return _userStakingInfo[_user][_stakingId];
    }

    // =====================
    // Internal Functions
    // =====================
    /**
     * @dev Internal function to handle staking logic
     * @param _amount Amount to stake
     * @param _stakingPeriod Staking period (in days)
     */
    function _stake(uint112 _amount, uint40 _stakingPeriod) internal {
        // Get the current staking ID counter
        uint48 counter = _idCounter;

        // Store staking info for the user and this counter (ID)
        _userStakingInfo[msg.sender][counter] = StakingInfo(
            counter,
            uint40(block.timestamp),
            _stakingPeriod,
            _amount,
            uint40(block.timestamp)
        );
        // Emit event for off-chain tracking
        emit Stake(
            msg.sender,
            counter,
            _amount,
            _stakingPeriod,
            block.timestamp
        );
        // Transfer tokens from user to contract for staking
        _token.transferFrom(msg.sender, address(this), _amount);
        // Increment staking ID counter for uniqueness
        _idCounter++;
    }

    /**
     * @dev Internal function to extend staking period after completion
     * @param _id Staking position ID
     * @param _stakingPeriod New staking period
     */
    function _extendStakingPeriod(uint48 _id, uint40 _stakingPeriod) internal {
        // Calculate the withdrawable amount (principal + rewards) for the ended stake
        uint112 amount = uint112(_withdrawableAmount(_id));
        // Remove the old staking info
        delete _userStakingInfo[msg.sender][_id];
        // Stake the total amount again for the new period
        _stake(amount, _stakingPeriod);
    }

    /**
     * @dev Internal function to withdraw all tokens from a staking position
     * @param _id Staking position ID
     */
    function _withdrawAll(uint48 _id) internal {
        StakingInfo storage stakingInfo = _userStakingInfo[msg.sender][_id];

        // Calculate how much can be withdrawn (principal + rewards)
        uint256 withdrawableAmount_ = _withdrawableAmount(_id);

        // Emit withdrawal event for off-chain tracking
        emit Withdraw(
            msg.sender,
            _id,
            stakingInfo.stakedAmount,
            withdrawableAmount_,
            stakingInfo.stakingPeriod,
            stakingInfo.startTime,
            block.timestamp
        );
        // Remove staking info for this position
        delete _userStakingInfo[msg.sender][_id];
        // Transfer tokens to user
        _token.transfer(msg.sender, withdrawableAmount_);
    }

    /**
     * @dev Internal function to withdraw a specific amount from a staking position
     * @param _id Staking position ID
     * @param _withdrawAmount Amount to withdraw
     */
    function _withdraw(uint48 _id, uint112 _withdrawAmount) internal {
        StakingInfo storage stakingInfo = _userStakingInfo[msg.sender][_id];
        // Calculate how much can be withdrawn (principal + rewards)
        uint256 withdrawableAmount_ = _withdrawableAmount(_id);

        // Ensure user cannot withdraw more than allowed
        if (_withdrawAmount > withdrawableAmount_) {
            revert VMFStaking__InsufficientWithdrawBalance();
        }

        // Emit withdrawal event
        emit Withdraw(
            msg.sender,
            _id,
            stakingInfo.stakedAmount,
            _withdrawAmount,
            stakingInfo.stakingPeriod,
            stakingInfo.startTime,
            block.timestamp
        );

        // If user withdraws less than the total, restake the remainder at minimum period
        if (_withdrawAmount < stakingInfo.stakedAmount) {
            // Automatically restake the leftover tokens at minimum period
            stakingInfo.stakedAmount -= _withdrawAmount;
        }

        // Transfer tokens to user
        _token.transfer(msg.sender, _withdrawAmount);
    }

    /**
     * @dev Internal function to withdraw only the yield (rewards) from a staking position
     * @param _id Staking position ID
     *
     * Requirements:
     * - There must be yield available since the last claim.
     * - Only callable by the owner of the stake.
     *
     * Emits a {StakeYieldWithdraw} event.
     */
    function _withdrawYield(uint48 _id) internal {
        StakingInfo storage stakingInfo = _userStakingInfo[msg.sender][_id];

        // Time passed since last yield claim
        uint256 lastYieldClaim = stakingInfo.lastYieldClaimAt;

        // Prevent claiming yield multiple times in the same block
        if (lastYieldClaim == block.timestamp)
            revert VMFStaking__NoYieldToWithdrawYet();

        // Calculate yield earned since last claim
        uint256 _stakeYield = calculateStakeYield(
            _minimumAPRRate,
            stakingInfo.stakedAmount,
            block.timestamp - lastYieldClaim
        );

        // Emit event for off-chain tracking
        emit StakeYieldWithdraw(
            msg.sender,
            _id,
            stakingInfo.stakedAmount,
            _stakeYield,
            block.timestamp - lastYieldClaim,
            lastYieldClaim,
            block.timestamp
        );

        // Update last claim timestamp
        stakingInfo.lastYieldClaimAt = uint40(block.timestamp);

        // Transfer yield to user
        _token.transfer(msg.sender, _stakeYield);
    }

    /**
     * @dev Internal view function to calculate the withdrawable amount for a staking position
     * @param _id Staking position ID
     * @return The withdrawable amount (including rewards)
     *
     * Side effect: Updates lastYieldClaimAt to current block timestamp
     */
    function _withdrawableAmount(uint48 _id) internal returns (uint256) {
        StakingInfo storage stakingInfo = _userStakingInfo[msg.sender][_id];
        // Use lastYieldClaimAt as the last checkpoint
        uint256 stakingPeriod = stakingInfo.lastYieldClaimAt;
        // Time passed since last claim
        uint256 timePassed = block.timestamp - stakingPeriod;

        // Update last claim timestamp
        stakingInfo.lastYieldClaimAt = uint40(block.timestamp);

        // Calculate the final amount (principal + rewards)
        uint256 amountWhenStakingPeriodEnds = calculateCompound(
            _minimumAPRRate,
            stakingInfo.stakedAmount,
            timePassed
        );

        return amountWhenStakingPeriodEnds;
    }

    /**
     * @notice Calculates the compound interest for staking rewards
     * @dev Uses prb-math for fixed-point math
     * @param _ratio Staking rewards rate (APR, scaled)
     * @param _principal Amount staked
     * @param _n Staking intervals in seconds
     * @return The final amount after compounding
     */
    function calculateCompound(
        uint256 _ratio,
        uint256 _principal,
        uint256 _n
    ) public pure returns (uint256) {
        UD60x18 totalAprRate = ud(_ratio * _n);

        // yieldPerToken = 1 + totalAprRate
        UD60x18 yieldPerToken = ud(1e18).add(totalAprRate);

        // totalYield = yieldPerToken * _principal
        UD60x18 totalYield = yieldPerToken.mul(ud(_principal));

        // Uses fixed-point math to compute principal * (1 + (ratio*n))
        return totalYield.unwrap();
    }

    /**
     * @notice Calculates the yield (rewards only) for staking
     * @dev Uses fixed-point math to compute principal * APR * time
     * @param _ratio Staking rewards rate (APR, scaled)
     * @param _principal Amount staked
     * @param _n Staking duration in seconds
     * @return The yield amount (excluding principal)
     */
    function calculateStakeYield(
        uint256 _ratio,
        uint256 _principal,
        uint256 _n
    ) public pure returns (uint256) {
        UD60x18 totalAprRate = ud(_ratio * _n);

        // totalYield = totalAprRate * principal
        UD60x18 totalYield = totalAprRate.mul(ud(_principal));

        // Uses fixed-point math to compute principal * (APR * time)
        return totalYield.unwrap();
    }
}
