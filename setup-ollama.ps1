# ============================================
# AI求职辅导 - Ollama 千问模型一键安装脚本
# 完全免费，无需注册，无需 API Key
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI求职辅导 - Ollama 千问模型安装" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Ollama 是否已安装
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaInstalled) {
    Write-Host "[!] 未检测到 Ollama，正在打开下载页面..." -ForegroundColor Yellow
    Write-Host "    请下载安装后重新运行此脚本" -ForegroundColor Yellow
    Write-Host "    下载地址：https://ollama.com/download/windows" -ForegroundColor White
    Start-Process "https://ollama.com/download/windows"
    Write-Host ""
    Write-Host "安装完成后，请重新运行此脚本。按任意键退出..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "[OK] 已检测到 Ollama" -ForegroundColor Green
Write-Host ""

# 检查 Ollama 服务是否在运行
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Ollama 服务正在运行" -ForegroundColor Green
} catch {
    Write-Host "[!] Ollama 服务未运行，正在启动..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "[OK] Ollama 服务已启动" -ForegroundColor Green
}

Write-Host ""

# 拉取模型
$model = "qwen3:8b"
Write-Host "[*] 正在拉取模型: $model (约 5GB，首次下载需要几分钟)..." -ForegroundColor Cyan
Write-Host ""

# 检查模型是否已存在
try {
    $tagsResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    $tagsData = $tagsResponse.Content | ConvertFrom-Json
    $modelExists = $tagsData.models | Where-Object { $_.name -eq $model }
    
    if ($modelExists) {
        Write-Host "[OK] 模型 $model 已存在，跳过下载" -ForegroundColor Green
    } else {
        Write-Host "[*] 首次下载，请耐心等待..." -ForegroundColor Yellow
        ollama pull $model
        Write-Host "[OK] 模型 $model 下载完成" -ForegroundColor Green
    }
} catch {
    Write-Host "[*] 正在下载模型..." -ForegroundColor Yellow
    ollama pull $model
    Write-Host "[OK] 模型 $model 下载完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装完成！千问模型已就绪" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor White
Write-Host "  1. 启动后端服务: cd server ; npm run dev" -ForegroundColor Gray
Write-Host "  2. 启动前端: npm run dev" -ForegroundColor Gray
Write-Host "  3. 打开浏览器访问应用，即可使用 AI 分析功能" -ForegroundColor Gray
Write-Host ""
Write-Host "可选模型：" -ForegroundColor White
Write-Host "  ollama pull qwen2.5:7b    (更快的千问2.5)" -ForegroundColor Gray
Write-Host "  ollama pull deepseek-r1:8b (DeepSeek推理模型)" -ForegroundColor Gray
Write-Host "  ollama pull qwen2:1.5b    (轻量模型，配置较低时使用)" -ForegroundColor Gray
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")