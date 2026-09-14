param(
    [string]$BackendUrl = "http://localhost:5123",
    [string]$Username   = "admin",
    [string]$Password   = "mecaflow2024"
)

$ErrorActionPreference = "Stop"
$script:Token = ""

function Invoke-Api {
    param([string]$Method, [string]$Path, [object]$Body = $null)
    $uri = "$BackendUrl/api/$Path"
    $headers = @{ "Content-Type" = "application/json" }
    if ($script:Token) { $headers["Authorization"] = "Bearer $script:Token" }
    $params = @{ Method = $Method; Uri = $uri; Headers = $headers; UseBasicParsing = $true }
    if ($null -ne $Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    $r = Invoke-WebRequest @params
    return ($r.Content | ConvertFrom-Json)
}

# 1. Login
Write-Host "Logging in..." -ForegroundColor Cyan
$login = Invoke-Api -Method POST -Path "auth/login" -Body @{ username = $Username; password = $Password }
$script:Token = $login.token
Write-Host "  OK - $($login.username) / $($login.tenantName)" -ForegroundColor Green

# 2. Wipe
Write-Host "`nWiping existing data..." -ForegroundColor Yellow

$orders = Invoke-Api -Method GET -Path "serviceorders"
foreach ($o in $orders) {
    try { Invoke-Api -Method DELETE -Path "serviceorders/$($o.id)" | Out-Null } catch {}
}
Write-Host "  Deleted $($orders.Count) orders"

$vehicles = Invoke-Api -Method GET -Path "vehicles"
foreach ($v in $vehicles) {
    try { Invoke-Api -Method DELETE -Path "vehicles/$($v.id)" | Out-Null } catch {}
}
Write-Host "  Deleted $($vehicles.Count) vehicles"

$customers = Invoke-Api -Method GET -Path "customers"
foreach ($c in $customers) {
    try { Invoke-Api -Method DELETE -Path "customers/$($c.id)" | Out-Null } catch {}
}
Write-Host "  Deleted $($customers.Count) customers"

$mechanics = Invoke-Api -Method GET -Path "mechanics"
foreach ($m in $mechanics) {
    try { Invoke-Api -Method DELETE -Path "mechanics/$($m.id)" | Out-Null } catch {}
}
Write-Host "  Deleted $($mechanics.Count) mechanics"

# 3. Mechanics
Write-Host "`nCreating mechanics..." -ForegroundColor Cyan
$mechInput = @(
    @{ name = "Carlos Rodriguez";  phone = "+54 9 291 555-1001"; specialty = "Motor y transmision" },
    @{ name = "Diego Fernandez";   phone = "+54 9 291 555-1002"; specialty = "Electricidad" },
    @{ name = "Martin Lopez";      phone = "+54 9 291 555-1003"; specialty = "Frenos y suspension" },
    @{ name = "Pablo Garcia";      phone = "+54 9 291 555-1004"; specialty = "Chapa y pintura" },
    @{ name = "Sebastian Torres";  phone = "+54 9 291 555-1005"; specialty = "Motor diesel" },
    @{ name = "Facundo Romero";    phone = "+54 9 291 555-1006"; specialty = "Aire acondicionado" },
    @{ name = "Nicolas Herrera";   phone = "+54 9 291 555-1007"; specialty = "Sistemas de escape" },
    @{ name = "Rodrigo Martinez";  phone = "+54 9 291 555-1008"; specialty = "Alineacion y balanceo" },
    @{ name = "Gustavo Sanchez";   phone = "+54 9 291 555-1009"; specialty = "Inyeccion electronica" },
    @{ name = "Leonardo Diaz";     phone = "+54 9 291 555-1010"; specialty = "Gral. multimarca" }
)
$createdMechanics = @()
foreach ($m in $mechInput) {
    $r = Invoke-Api -Method POST -Path "mechanics" -Body $m
    $createdMechanics += $r
    Write-Host "  + $($m.name)"
}

# 4. Customers
Write-Host "`nCreating customers..." -ForegroundColor Cyan
$custInput = @(
    @{ name = "Juan Perez";       phone = "+54 9 291 444-2001"; email = "juan.perez@gmail.com" },
    @{ name = "Maria Gonzalez";   phone = "+54 9 291 444-2002"; email = "maria.gonzalez@yahoo.com.ar" },
    @{ name = "Roberto Silva";    phone = "+54 9 291 444-2003"; email = "roberto.silva@hotmail.com" },
    @{ name = "Ana Ramirez";      phone = "+54 9 291 444-2004"; email = "ana.ramirez@gmail.com" },
    @{ name = "Luis Moreno";      phone = "+54 9 291 444-2005"; email = $null },
    @{ name = "Claudia Jimenez";  phone = "+54 9 291 444-2006"; email = "claudia.jimenez@gmail.com" },
    @{ name = "Hector Vargas";    phone = "+54 9 291 444-2007"; email = $null },
    @{ name = "Florencia Castro"; phone = "+54 9 291 444-2008"; email = "flor.castro@gmail.com" },
    @{ name = "Miguel Ruiz";      phone = "+54 9 291 444-2009"; email = "miguel.ruiz@empresa.com" },
    @{ name = "Patricia Acosta";  phone = "+54 9 291 444-2010"; email = "pacosta@gmail.com" }
)
$createdCustomers = @()
foreach ($c in $custInput) {
    $r = Invoke-Api -Method POST -Path "customers" -Body $c
    $createdCustomers += $r
    Write-Host "  + $($c.name)"
}

# 5. Vehicles
Write-Host "`nCreating vehicles..." -ForegroundColor Cyan
$vehInput = @(
    @{ brand = "Volkswagen"; model = "Gol Trend";     year = 2018; plate = "AB123CD"; color = "Blanco" },
    @{ brand = "Chevrolet";  model = "Corsa Classic"; year = 2015; plate = "EF456GH"; color = "Rojo" },
    @{ brand = "Ford";       model = "Focus";         year = 2019; plate = "IJ789KL"; color = "Gris" },
    @{ brand = "Renault";    model = "Logan";         year = 2020; plate = "MN012OP"; color = "Blanco" },
    @{ brand = "Fiat";       model = "Palio";         year = 2016; plate = "QR345ST"; color = "Negro" },
    @{ brand = "Toyota";     model = "Etios";         year = 2021; plate = "UV678WX"; color = "Plata" },
    @{ brand = "Peugeot";    model = "208";           year = 2022; plate = "YZ901AB"; color = "Azul" },
    @{ brand = "Volkswagen"; model = "Suran";         year = 2017; plate = "CD234EF"; color = "Verde" },
    @{ brand = "Hyundai";    model = "HB20";          year = 2023; plate = "GH567IJ"; color = "Gris" },
    @{ brand = "Nissan";     model = "March";         year = 2019; plate = "KL890MN"; color = "Blanco" }
)
$createdVehicles = @()
for ($i = 0; $i -lt $vehInput.Count; $i++) {
    $v = $vehInput[$i]
    $body = @{
        customerId   = $createdCustomers[$i].id
        licensePlate = $v.plate
        brand        = $v.brand
        model        = $v.model
        year         = $v.year
        color        = $v.color
        notes        = $null
    }
    $r = Invoke-Api -Method POST -Path "vehicles" -Body $body
    $createdVehicles += $r
    Write-Host "  + $($v.plate) $($v.brand) $($v.model) ($($createdCustomers[$i].name))"
}

# 6. Orders (30)
Write-Host "`nCreating service orders..." -ForegroundColor Cyan

$diagnoses = @(
    "Ruido en motor al arrancar en frio",
    "Frenado irregular, vibracion en pedal",
    "Luz de check engine encendida",
    "Perdida de refrigerante",
    "Cambio de aceite y filtros rutinario",
    "No enciende, bateria descargada",
    "Revision general pre-viaje",
    "Cambio de pastillas y discos delanteros",
    "Ruido en suspension delantera derecha",
    "Falla en sistema de aire acondicionado",
    "Perdida de potencia a altas RPM",
    "Cambio de correa de distribucion",
    "Humo azul por escape",
    "Bateria no retiene carga",
    "Golpe de calor, revision general"
)

$orderStatuses = @(
    "Open","Open","Open","Open",
    "InProgress","InProgress","InProgress","InProgress","InProgress",
    "Completed","Completed","Completed","Completed","Completed","Completed",
    "Completed","Completed","Completed","Completed","Completed",
    "Cancelled","Cancelled","Cancelled",
    "Open","InProgress","Completed","Completed","Open","InProgress","Completed"
)

$rng = New-Object System.Random(42)

for ($i = 0; $i -lt 30; $i++) {
    $vIdx    = $rng.Next(0, $createdVehicles.Count)
    $mIdx    = $rng.Next(0, $createdMechanics.Count)
    $dIdx    = $rng.Next(0, $diagnoses.Count)
    $mileage = $rng.Next(10000, 180000)
    $status  = $orderStatuses[$i]

    if ($status -ne "Open") {
        $mechName = $createdMechanics[$mIdx].name
    } else {
        $mechName = $null
    }

    if ($i % 3 -eq 0) {
        $items = @(
            @{ description = "Aceite sintetico 5W40"; type = "Part"; quantity = 4; unitPrice = 2200 },
            @{ description = "Filtro de aceite"; type = "Part"; quantity = 1; unitPrice = 950 },
            @{ description = "Cambio de aceite"; type = "Labor"; quantity = 1; unitPrice = 3500 }
        )
        $total = 4 * 2200 + 950 + 3500
    } else {
        $items = @(
            @{ description = "Mano de obra"; type = "Labor"; quantity = 1; unitPrice = 8500 },
            @{ description = "Repuesto"; type = "Part"; quantity = 1; unitPrice = 4200 }
        )
        $total = 8500 + 4200
    }

    $createBody = @{
        vehicleId           = $createdVehicles[$vIdx].id
        diagnosisNotes      = $diagnoses[$dIdx]
        mileageIn           = $mileage
        assignedMechanic    = $mechName
        internalNotes       = $null
        estimatedDeliveryAt = $null
        items               = $items
    }
    $created = Invoke-Api -Method POST -Path "serviceorders" -Body $createBody

    if ($status -ne "Open") {
        if ($status -eq "Completed") { $finalAmt = $total } else { $finalAmt = 0 }
        $updateBody = @{
            status              = $status
            diagnosisNotes      = $diagnoses[$dIdx]
            mileageIn           = $mileage
            assignedMechanic    = $mechName
            internalNotes       = $null
            estimatedDeliveryAt = $null
            totalEstimate       = $total
            totalFinal          = $finalAmt
            items               = $items
        }
        try { Invoke-Api -Method PUT -Path "serviceorders/$($created.id)" -Body $updateBody | Out-Null } catch {}
    }

    $plate = $createdVehicles[$vIdx].licensePlate
    Write-Host "  [$($i+1)/30] $status $plate"
}

Write-Host ""
Write-Host "Done! 10 mechanics, 10 customers, 10 vehicles, 30 orders" -ForegroundColor Green
