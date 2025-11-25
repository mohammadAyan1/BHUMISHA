$body = '{"data":[]}'
$uri = "http://localhost:5000/api/allsales/bills"

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Error Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Response | ConvertFrom-Json | ConvertTo-Json)"
}
