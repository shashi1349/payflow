const VALID_TRANSITIONS = {
  initiated:  ["processing"],
  processing: ["settled", "failed"],
  settled:    [],   // terminal
  failed:     [],   // terminal
};

export const transitionPayment = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed) {
    const error = new Error(`Unknown status: ${currentStatus}`);
    error.statusCode = 400;
    throw error;
  }

  if (!allowed.includes(targetStatus)) {
    const error = new Error(
      `Illegal transition: ${currentStatus} → ${targetStatus}`
    );
    error.statusCode = 422;
    throw error;
  }

  return true;
};

export const isTerminalStatus = (status) => {
  return VALID_TRANSITIONS[status]?.length === 0;
};