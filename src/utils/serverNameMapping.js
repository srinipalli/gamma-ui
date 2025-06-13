// Returns the global server name for a given server/environment
export function getGlobalServerName(serverName, environment) {
  const envOrder = ['Dev', 'QA', 'Stage', 'Prod'];
  const serverCounts = { Dev: 1, QA: 2, Stage: 2, Prod: 4 };
  let current = 1;
  for (const env of envOrder) {
    const count = serverCounts[env];
    for (let i = 1; i <= count; i++) {
      if (serverName === `server${i}` && environment === env) {
        return `server ${current}`;
      }
      current++;
    }
  }
  // fallback
  return `${serverName} (${environment})`;
}
