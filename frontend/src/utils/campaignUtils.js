export const getProgressPercentage = (raised, goal) => {
  return Math.min((parseFloat(raised) / parseFloat(goal)) * 100, 100).toFixed(1);
};

export const isDeadlinePassed = (deadline) => {
  return new Date() > deadline;
};

export const canFinalizeCampaign = (campaign) => {
  const deadlinePassed = new Date() > campaign.deadline;
  const goalReached = parseFloat(campaign.totalRaised) >= parseFloat(campaign.goalAmount);
  return deadlinePassed || goalReached;
};
