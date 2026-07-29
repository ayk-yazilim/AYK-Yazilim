Option Explicit
Dim shell, fso, folder, appPath, iconPath, desktopLink, startupLink, sc, answer
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
appPath = folder & "\AYK-Muhasebe-Yardimcisi.hta"
iconPath = folder & "\AYK.ico"

If Not fso.FileExists(appPath) Then
  MsgBox "Uygulama dosyasý bulunamadý.", 16, "AYK Kurulum"
  WScript.Quit
End If
If Not fso.FileExists(iconPath) Then
  MsgBox "AYK.ico dosyasý bulunamadý. ZIP içeriðini eksiksiz çýkarýn.", 16, "AYK Kurulum"
  WScript.Quit
End If

desktopLink = shell.SpecialFolders("Desktop") & "\AYK Muhasebe Yardýmcýsý.lnk"
Set sc = shell.CreateShortcut(desktopLink)
sc.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%\System32\mshta.exe")
sc.Arguments = Chr(34) & appPath & Chr(34)
sc.WorkingDirectory = folder
sc.IconLocation = iconPath & ",0"
sc.Description = "AYK Muhasebe Yardýmcýsý"
sc.Save

answer = MsgBox("Windows açýldýðýnda AYK Muhasebe Yardýmcýsý otomatik baþlatýlsýn mý?", 36, "AYK Kurulum")
startupLink = shell.SpecialFolders("Startup") & "\AYK Muhasebe Yardýmcýsý.lnk"
If answer = 6 Then
  Set sc = shell.CreateShortcut(startupLink)
  sc.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%\System32\mshta.exe")
  sc.Arguments = Chr(34) & appPath & Chr(34)
  sc.WorkingDirectory = folder
  sc.IconLocation = iconPath & ",0"
  sc.Description = "AYK Muhasebe Yardýmcýsý"
  sc.Save
End If
MsgBox "Kurulum tamamlandý. Masaüstü kýsayolu AYK simgesiyle oluþturuldu.", 64, "AYK Kurulum"
