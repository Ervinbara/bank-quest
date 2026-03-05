const PLAN_ACCESS = {
  none: {
    code: 'none',
    label: 'Gratuit',
    maxClients: 5,
    canSendInvitationEmails: false,
    monthlyInvitationEmailLimit: 0
  },
  solo: {
    code: 'solo',
    label: 'Solo',
    maxClients: 50,
    canSendInvitationEmails: true,
    monthlyInvitationEmailLimit: 100
  },
  pro: {
    code: 'pro',
    label: 'Pro',
    maxClients: 200,
    canSendInvitationEmails: true,
    monthlyInvitationEmailLimit: 500
  },
  cabinet: {
    code: 'cabinet',
    label: 'Cabinet',
    maxClients: null,
    canSendInvitationEmails: true,
    monthlyInvitationEmailLimit: 2000
  },
  test: {
    code: 'test',
    label: 'Test',
    maxClients: null,
    canSendInvitationEmails: true,
    monthlyInvitationEmailLimit: null
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

export const getRemainingInvitationEmails = ({ plan, sentCount }) => {
  const access = getPlanAccess(plan)
  if (!access.canSendInvitationEmails) return 0
  if (access.monthlyInvitationEmailLimit === null) return null
  return Math.max(0, access.monthlyInvitationEmailLimit - Math.max(0, Number(sentCount) || 0))
}
