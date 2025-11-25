Write-Host "Testing /api/allsales/bills endpoint..." -ForegroundColor Green

$body = '{"data":[]}'
$uri = "http://localhost:5000/api/allsales/bills"

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content
} catch [System.Net.WebException] {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    Write-Host "❌ ERROR! Status: $statusCode" -ForegroundColor Red
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Response:" -ForegroundColor Red
    Write-Host $content
    $reader.Close()
} catch {
    Write-Host "❌ EXCEPTION: $($_.Exception.Message)" -ForegroundColor Red
}
