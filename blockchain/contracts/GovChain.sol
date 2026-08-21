// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GovChain {
    uint256 public constant DEMO_INR_PER_ETH = 5_000_000;

    struct Project {
        string name;
        uint256 budgetRupees;
        address governmentWallet;
        uint8 status;
        uint256 milestoneCount;
        uint256 escrowWei;
        uint256 releasedWei;
        bool exists;
    }

    struct Milestone {
        uint256 projectId;
        string title;
        string descriptionHash;
        uint256 requestedAmount;
        address contractorWallet;
        uint8 status;
        uint8 aiScore;
        uint256 approvedPayoutWei;
        bool exists;
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone) public milestones;

    uint256 public projectCount;
    uint256 public milestoneCount;

    event ProjectRecorded(uint256 projectId, string name, uint256 budgetRupees, uint256 escrowWei);
    event MilestoneRecorded(uint256 milestoneId, uint256 projectId, string title, uint256 payoutWeiQuote);
    event MilestoneApproved(uint256 milestoneId, uint256 payoutWei, address contractorWallet);
    event MilestoneFlagged(uint256 milestoneId);
    event MilestoneRejected(uint256 milestoneId);

    function quoteProjectEscrowWei(uint256 budgetRupees) public pure returns (uint256) {
        require(budgetRupees > 0, "Budget must be positive");
        return (budgetRupees * 1 ether) / DEMO_INR_PER_ETH;
    }

    function quoteMilestonePayoutWei(uint256 requestedAmount) public pure returns (uint256) {
        require(requestedAmount > 0, "Requested amount must be positive");
        return (requestedAmount * 1 ether) / DEMO_INR_PER_ETH;
    }

    function createProject(string memory name, uint256 budgetRupees) external payable {
        require(bytes(name).length > 0, "Project name required");
        require(budgetRupees > 0, "Budget must be positive");
        uint256 escrowWei = quoteProjectEscrowWei(budgetRupees);
        require(msg.value == escrowWei, "Send exact demo escrow");

        projectCount++;
        projects[projectCount] = Project({
            name: name,
            budgetRupees: budgetRupees,
            governmentWallet: msg.sender,
            status: 0,
            milestoneCount: 0,
            escrowWei: escrowWei,
            releasedWei: 0,
            exists: true
        });

        emit ProjectRecorded(projectCount, name, budgetRupees, escrowWei);
    }

    function submitMilestone(
        uint256 projectId,
        string memory title,
        string memory descriptionHash,
        uint256 requestedAmount,
        uint8 aiScore
    ) external {
        require(projects[projectId].exists, "Invalid project");
        require(bytes(title).length > 0, "Milestone title required");
        require(requestedAmount > 0, "Requested amount must be positive");

        milestoneCount++;
        milestones[milestoneCount] = Milestone({
            projectId: projectId,
            title: title,
            descriptionHash: descriptionHash,
            requestedAmount: requestedAmount,
            contractorWallet: msg.sender,
            status: 0,
            aiScore: aiScore,
            approvedPayoutWei: 0,
            exists: true
        });

        projects[projectId].milestoneCount++;
        if (projects[projectId].status == 0) {
            projects[projectId].status = 1;
        }

        emit MilestoneRecorded(milestoneCount, projectId, title, quoteMilestonePayoutWei(requestedAmount));
    }

    function approveMilestone(uint256 milestoneId) external {
        require(milestones[milestoneId].exists, "Invalid milestone");
        require(
            milestones[milestoneId].status == 0 || milestones[milestoneId].status == 2,
            "Only pending or flagged milestones can be approved"
        );

        uint256 projectId = milestones[milestoneId].projectId;
        uint256 payoutWei = quoteMilestonePayoutWei(milestones[milestoneId].requestedAmount);
        require(projects[projectId].exists, "Invalid project");
        require(
            projects[projectId].releasedWei + payoutWei <= projects[projectId].escrowWei,
            "Escrow exhausted"
        );

        milestones[milestoneId].status = 1;
        milestones[milestoneId].approvedPayoutWei = payoutWei;
        projects[projectId].releasedWei += payoutWei;

        if (projects[projectId].releasedWei >= projects[projectId].escrowWei) {
            projects[projectId].status = 2;
        }

        (bool sent, ) = payable(milestones[milestoneId].contractorWallet).call{value: payoutWei}("");
        require(sent, "Payout failed");

        emit MilestoneApproved(milestoneId, payoutWei, milestones[milestoneId].contractorWallet);
    }

    function flagMilestone(uint256 milestoneId) external {
        require(milestones[milestoneId].exists, "Invalid milestone");
        require(milestones[milestoneId].status == 0, "Only pending milestones can be flagged");

        milestones[milestoneId].status = 2;
        emit MilestoneFlagged(milestoneId);
    }

    function rejectMilestone(uint256 milestoneId) external {
        require(milestones[milestoneId].exists, "Invalid milestone");
        require(milestones[milestoneId].status == 2, "Only flagged milestones can be rejected");

        milestones[milestoneId].status = 3;
        emit MilestoneRejected(milestoneId);
    }
}
