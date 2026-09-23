param(
  [Parameter(Mandatory = $true)][string]$InputTextPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$Rate = 0,
  [string]$VoiceName = ""
)

$ErrorActionPreference = "Stop"
$text = [System.IO.File]::ReadAllText($InputTextPath, [System.Text.Encoding]::UTF8)
$speaker = $null
$systemSpeechError = $null
try {
  Add-Type -AssemblyName System.Speech
  $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $voices = @($speaker.GetInstalledVoices() | Where-Object { $_.Enabled })
  if ($voices.Count -eq 0) {
    throw "No enabled Windows speech voice is installed."
  }
  $selectedVoice = if ($VoiceName) { $voices | Where-Object { $_.VoiceInfo.Name -like "*$VoiceName*" } | Select-Object -First 1 } else { $voices[0] }
  if ($null -eq $selectedVoice) { throw "Requested Windows voice '$VoiceName' is not installed." }
  $speaker.SelectVoice($selectedVoice.VoiceInfo.Name)
  $speaker.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
  $speaker.SetOutputToWaveFile($OutputPath)
  $speaker.Speak($text)
  return
} catch {
  $systemSpeechError = $_.Exception.Message
} finally {
  if ($null -ne $speaker) {
    $speaker.Dispose()
  }
}

# Some Windows installations expose OneCore voices through SAPI but not
# System.Speech. Use the COM API as the second local backend.
$sapiVoice = $null
$sapiStream = $null
try {
  $sapiVoice = New-Object -ComObject SAPI.SpVoice
  if ($VoiceName) {
    $sapiMatch = @($sapiVoice.GetVoices() | Where-Object { $_.GetDescription() -like "*$VoiceName*" }) | Select-Object -First 1
    if ($null -eq $sapiMatch) { throw "Requested SAPI voice '$VoiceName' is not installed." }
    $sapiVoice.Voice = $sapiMatch
  }
  $sapiStream = New-Object -ComObject SAPI.SpFileStream
  $sapiStream.Open($OutputPath, 3, $false)
  $sapiVoice.AudioOutputStream = $sapiStream
  $sapiVoice.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
  [void]$sapiVoice.Speak($text)
} catch {
  throw "System.Speech failed: $systemSpeechError. SAPI failed: $($_.Exception.Message)"
} finally {
  if ($null -ne $sapiStream) {
    try { $sapiStream.Close() } catch { }
  }
}
