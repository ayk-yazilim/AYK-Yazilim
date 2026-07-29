Option Explicit

Dim fso, sh, appDir, appFile, updaterFile, command, exitCode
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
appFile = appDir & "\AYK-Muhasebe-Yardimcisi.hta"
updaterFile = appDir & "\Core\AYK-Updater.ps1"

If Not fso.FileExists(appFile) Then
    MsgBox "AYK-Muhasebe-Yardimcisi.hta bulunamadi." & vbCrLf & _
           "Launcher ile HTA dosyasi ayni klasorde olmalidir.", _
           16, "AYK Muhasebe Yardimcisi"
    WScript.Quit 1
End If

If fso.FileExists(updaterFile) Then
    command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & updaterFile & """ -AppDir """ & appDir & """"
    On Error Resume Next
    exitCode = sh.Run(command, 0, True)
    If Err.Number = 0 And exitCode = 10 Then
        WScript.Quit 0
    End If
    Err.Clear
    On Error GoTo 0
End If

sh.Run "mshta.exe """ & appFile & """", 1, False
