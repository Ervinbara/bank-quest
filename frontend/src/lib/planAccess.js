const PLAN_ACCESS = {
  none: {
    code: 'none',
    label: 'Gratuit',
    maxClients: 5,
    canSendInvitationEmails: false
  },
  solo: {
    code: 'solo',
    label: 'Solo',
    maxClients: 50,
    canSendInvitationEmails: true
  },
  pro: {
    code: 'pro',
    label: 'Pro',
    maxClients: 200,
    canSendInvitationEmails: true
  },
  cabinet: {
    code: 'cabinet',
    label: 'Cabinet',
    maxClients: null,
    canSendInvitationEmails: true
  },
  test: {
    code: 'test',
    label: 'Test',
    maxClients: null,
    canSendInvitationEmails: true
  }
}

export const TEST_PLAN_ALLOWED_EMAILS = new Set(['bankquest.pro@gmail.com'])

export const normalizePlan = (plan) => {
  const key = String(plan || '').trim().toLowerCase()
  return PLAN_ACCESS[key] ? key : 'none'
}

export const getPlanAccess = (plan) => PLAN_ACCESS[normalizePlan(plan)]

export const getRemainingClientSlots = ({ plan, clientCount }) => {
  const access = getPlanAccess(plan)
  if (access.maxClients === null) return null
  return Math.max(0, access.maxClients - Math.max(0, Number(clientCount) || 0))
}

export const isClientLimitReached = ({ plan, clientCount }) => {
  const access = getPlanAccess(plan)
  if (access.maxClients === null) return false
  return (Number(clientCount) || 0) >= access.maxClients
}

