Option Explicit

Dim fso, sh, appDir, appFile, urlFile, updateUrl
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
appFile = appDir & "\AYK-Muhasebe-Yardimcisi.hta"
urlFile = appDir & "\update-url.txt"
updateUrl = ""

If fso.FileExists(urlFile) Then
    On Error Resume Next
    updateUrl = Trim(fso.OpenTextFile(urlFile, 1, False).ReadAll)
    On Error GoTo 0
End If

If Not fso.FileExists(appFile) Then
    MsgBox "AYK-Muhasebe-Yardimcisi.hta bulunamadi." & vbCrLf & _
           "Launcher ile HTA dosyasi ayni klasorde olmalidir.", _
           16, "AYK Muhasebe Yardimcisi"
    WScript.Quit 1
End If

' Guncelleme adresi tanimli degilse program yine normal olarak acilir.
' Gercek sunucu adresi tanimlandiginda guncelleme kontrolu buraya eklenecektir.
sh.Run "mshta.exe """ & appFile & """", 1, False
