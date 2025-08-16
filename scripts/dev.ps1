$ErrorActionPreference = 'Stop'

$procs = @()
$procs += Start-Process -FilePath 'uvicorn' -ArgumentList 'app.main:app --reload --port 8000' -WorkingDirectory 'services/core-api' -PassThru -NoNewWindow
$procs += Start-Process -FilePath 'uvicorn' -ArgumentList 'app.main:app --reload --port 8010' -WorkingDirectory 'services/echo' -PassThru -NoNewWindow
$procs += Start-Process -FilePath 'uvicorn' -ArgumentList 'app.main:app --reload --port 8020' -WorkingDirectory 'services/audita' -PassThru -NoNewWindow
$procs += Start-Process -FilePath 'uvicorn' -ArgumentList 'app.main:app --reload --port 8030' -WorkingDirectory 'services/velora' -PassThru -NoNewWindow

Wait-Process -Id ($procs | Select-Object -ExpandProperty Id)
