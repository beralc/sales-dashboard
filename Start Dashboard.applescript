-- AppleScript para iniciar el Dashboard Ta-Tum
-- Guarda este archivo como Aplicación en Script Editor

set dashboardPath to (path to me as text)
set dashboardFolder to POSIX path of (do shell script "dirname " & quoted form of POSIX path of dashboardPath)

tell application "Terminal"
	activate
	set newTab to do script "cd " & quoted form of dashboardFolder & " && ./start-dashboard.sh"
	set custom title of newTab to "Dashboard Ta-Tum"
end tell
