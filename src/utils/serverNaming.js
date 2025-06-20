// utils/serverNaming.js
export const getGlobalServerName = (serverName, environment) => {
  // Environment mapping for consistent naming
  const envMapping = {
    "Development": "dev",
    "Dev": "dev",
    "Staging": "stage", 
    "Stage": "stage",
    "Production": "prod",
    "Prod": "prod",
    "QA": "qa"
  }
  
  const envCode = envMapping[environment] || environment.toLowerCase()
  
  // Extract server number from server name (e.g., "server1" -> "1")
  const serverNumber = serverName.replace(/server/i, '')
  
  return `${envCode}-server${serverNumber}`
}

export const parseGlobalServerName = (globalName) => {
  // Parse "prod-server4" back to environment and server
  const parts = globalName.split('-')
  if (parts.length >= 2) {
    const envCode = parts[0]
    const serverPart = parts[1]
    
    const envMapping = {
      "dev": "Development",
      "stage": "Staging",
      "prod": "Production", 
      "qa": "QA"
    }
    
    return {
      environment: envMapping[envCode] || envCode,
      serverName: serverPart
    }
  }
  return { environment: "", serverName: globalName }
}

export const getServerDisplayName = (serverName, environment) => {
  return getGlobalServerName(serverName, environment)
}
