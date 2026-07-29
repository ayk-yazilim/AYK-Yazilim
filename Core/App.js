var activeTab='dashboardPage';
var sidebarCollapsed=false;
var settings={kiraLimit:46000,atlasRate:0.20,ovvoRate:0.25,defaultVat:20};
var userAbbreviations={};
var editingAbbreviation='';


var currentVersion='2.2.0';
function getAppFolder(){var p=decodeURIComponent(location.pathname);if(p.charAt(0)=='/')p=p.substr(1);p=p.replace(/\//g,'\\');return p.substring(0,p.lastIndexOf('\\'));}
function runUpdater(){try{var launcher=getAppFolder()+'\\AYK-Launcher.vbs';var fso=new ActiveXObject('Scripting.FileSystemObject');if(!fso.FileExists(launcher)){alert('AYK-Launcher.vbs bulunamadı.');return;}new ActiveXObject('WScript.Shell').Run('wscript.exe "'+launcher+'" /check',1,false);}catch(e){alert('Güncelleme kontrolü başlatılamadı: '+e.message);}}
function showWhatsNewOnce(){var seen=String(readRegistry('LastSeenVersion',''));if(seen==currentVersion)return;try{writeRegistry('LastSeenVersion',currentVersion,'REG_SZ');}catch(e){}setTimeout(function(){alert('AYK Muhasebe Yardımcısı V2.2.0\n\nBu sürümde:\n• GitHub Releases otomatik sürüm kontrolü eklendi.\n• Yeni sürüm bulunduğunda indirme onayı gösterilir.\n• Güncelleme ZIP paketi otomatik indirilip kurulur.\n• Güncelleme sonrası uygulama yeniden açılır.');},350);}
function resizeWindow(){
  var w=Math.min(620,screen.availWidth-40);var h=Math.min(600,screen.availHeight-60);
  if(w<420)w=screen.availWidth-20;if(h<420)h=screen.availHeight-30;
  window.resizeTo(w,h);window.moveTo((screen.availWidth-w)/2,(screen.availHeight-h)/2);
  loadSettings();renderExcelFormulas();showTab('dashboardPage','tabDashboard');showWhatsNewOnce();
}
function showTab(pageId,buttonId){
  var all=document.getElementsByTagName('*'),p=[],b=[],i,cn;
  for(i=0;i<all.length;i++){
    cn=' '+all[i].className+' ';
    if(cn.indexOf(' tab-page ')>-1)p[p.length]=all[i];
    if(cn.indexOf(' tab-button ')>-1)b[b.length]=all[i];
  }
  for(i=0;i<p.length;i++)p[i].className='tab-page';
  for(i=0;i<b.length;i++)b[i].className='tab-button';
  document.getElementById(pageId).className='tab-page active';document.getElementById(buttonId).className='tab-button active';activeTab=pageId;
  if(pageId=='kkegPage')document.getElementById('tutar').focus();
  else if(pageId=='yansitmaPage')document.getElementById('yansitmaTutar').focus();
  else if(pageId=='kiralikPage')document.getElementById('kiralikTutar').focus();
  else if(pageId=='unvanPage')document.getElementById('unvanInput').focus();
  else if(pageId=='kdvPage')document.getElementById('kdvInput').focus();
  else if(pageId=='stopajPage')document.getElementById('stopajInput').focus();
  else if(pageId=='tevkifatPage')document.getElementById('tevkifatInput').focus();
  else if(pageId=='excelPage')document.getElementById('excelSearch').focus();
  else if(pageId=='ayarPage')document.getElementById('settingLimit').focus();
}
function toggleSidebar(){
  var s=document.getElementById('sidebar');
  sidebarCollapsed=!sidebarCollapsed;
  s.className=sidebarCollapsed?'sidebar collapsed':'sidebar';
  document.getElementById('menuToggle').innerText=sidebarCollapsed?'»':'«';
}
function parseAmount(value){
  value=String(value||'').replace(/\s/g,'').replace(/TL/ig,'');
  if(value.indexOf(',')>-1&&value.indexOf('.')>-1){if(value.lastIndexOf(',')>value.lastIndexOf('.'))value=value.replace(/\./g,'').replace(',','.');else value=value.replace(/,/g,'');}
  else if(value.indexOf(',')>-1)value=value.replace(',','.');
  var n=parseFloat(value);return isNaN(n)?0:n;
}
function money(n){
  n=Math.round((n+0.0000001)*100)/100;var parts=n.toFixed(2).split('.'),intPart=parts[0],out='';
  while(intPart.length>3){out='.'+intPart.substr(intPart.length-3)+out;intPart=intPart.substr(0,intPart.length-3);}return intPart+out+','+parts[1]+' TL';
}
function getVatRate(){var r=document.getElementsByName('kdv');for(var i=0;i<r.length;i++)if(r[i].checked)return parseFloat(r[i].value);return .20;}
function calculateKKEG(){
  var total=parseAmount(document.getElementById('tutar').value),rate=getVatRate(),kkeg=total*.30,accepted=total*.70,base=accepted/(1+rate),vat=accepted-base;
  document.getElementById('kkeg').innerText=money(kkeg);document.getElementById('accepted').innerText=money(accepted);document.getElementById('base').innerText=money(base);document.getElementById('vat').innerText=money(vat);
}
function calculateYansitma(){
  var total=parseAmount(document.getElementById('yansitmaTutar').value),a=total*(settings.atlasRate/100),o=total*(settings.ovvoRate/100);
  document.getElementById('atlasLabel').innerText='Atlas → EMR (%'+formatRate(settings.atlasRate)+')';document.getElementById('ovvoLabel').innerText='EMR → OVVO (%'+formatRate(settings.ovvoRate)+')';
  document.getElementById('atlasKomisyon').innerText=money(a);document.getElementById('atlasToplam').innerText=money(total+a);document.getElementById('ovvoKomisyon').innerText=money(o);document.getElementById('ovvoToplam').innerText=money(total+o);
}
function calculateKiralik(){
  var total=parseAmount(document.getElementById('kiralikTutar').value),limit=settings.kiraLimit,accepted=Math.min(total,limit),kkeg=Math.max(total-limit,0);
  document.getElementById('kiralikLimit').innerText=money(limit);document.getElementById('kiralikAccepted').innerText=money(accepted);document.getElementById('kiralikKkeg').innerText=money(kkeg);
}
function formatRate(n){return Number(n).toFixed(2).replace('.',',');}
function selectedRateText(){return '%'+Math.round(getVatRate()*100);}
function copyText(text,msg){window.clipboardData.setData('Text',text);alert(msg);}
function copyKKEG(){var total=parseAmount(document.getElementById('tutar').value);copyText('KKEG HESAPLAMA\r\n\r\nFatura Tutarı: '+money(total)+'\r\nKDV Oranı: '+selectedRateText()+'\r\n%30 KKEG: '+document.getElementById('kkeg').innerText+'\r\n%70 Kabul: '+document.getElementById('accepted').innerText+'\r\nMatrah: '+document.getElementById('base').innerText+'\r\nİndirilecek KDV: '+document.getElementById('vat').innerText,'KKEG sonuçları kopyalandı.');}
function copyYansitma(){var total=parseAmount(document.getElementById('yansitmaTutar').value);copyText('YANSITMA HESAPLAMA '+formatRate(settings.atlasRate)+' - '+formatRate(settings.ovvoRate)+'\r\n\r\nAna Tutar: '+money(total)+'\r\n\r\nAtlas → EMR\r\nKomisyon: '+document.getElementById('atlasKomisyon').innerText+'\r\nFatura Tutarı: '+document.getElementById('atlasToplam').innerText+'\r\n\r\nEMR → OVVO\r\nKomisyon: '+document.getElementById('ovvoKomisyon').innerText+'\r\nFatura Tutarı: '+document.getElementById('ovvoToplam').innerText,'Yansıtma sonuçları kopyalandı.');}
function copyKiralik(){var total=parseAmount(document.getElementById('kiralikTutar').value);copyText('KİRALIK BİNEK ARAÇ KKEG\r\n\r\nKDV Hariç Aylık Kira: '+money(total)+'\r\nAylık Limit: '+document.getElementById('kiralikLimit').innerText+'\r\nGider Yazılabilir: '+document.getElementById('kiralikAccepted').innerText+'\r\nKKEG: '+document.getElementById('kiralikKkeg').innerText,'Kiralık araç sonuçları kopyalandı.');}
function clearKKEG(){document.getElementById('tutar').value='';setDefaultVat();calculateKKEG();document.getElementById('tutar').focus();}
function clearYansitma(){document.getElementById('yansitmaTutar').value='';calculateYansitma();document.getElementById('yansitmaTutar').focus();}
function clearKiralik(){document.getElementById('kiralikTutar').value='';calculateKiralik();document.getElementById('kiralikTutar').focus();}
function setDefaultVat(){var r=document.getElementsByName('kdv');for(var i=0;i<r.length;i++)r[i].checked=parseInt(parseFloat(r[i].value)*100,10)==settings.defaultVat;}
function getRegistryShell(){
  return new ActiveXObject('WScript.Shell');
}
function registryPath(name){
  return 'HKCU\\Software\\AYK\\MuhasebeYardimcisi\\'+name;
}
function readRegistry(name,defaultValue){
  try{
    var value=getRegistryShell().RegRead(registryPath(name));
    return (value===null||value==='')?defaultValue:value;
  }catch(e){return defaultValue;}
}
function writeRegistry(name,value,type){
  getRegistryShell().RegWrite(registryPath(name),value,type||'REG_SZ');
}
function deleteRegistryValue(name){
  try{getRegistryShell().RegDelete(registryPath(name));}catch(e){}
}
function loadSettings(){
  loadUserAbbreviations();
  settings.kiraLimit=parseFloat(readRegistry('KiraLimit',46000));
  settings.atlasRate=parseFloat(readRegistry('AtlasRate','0.20'));
  settings.ovvoRate=parseFloat(readRegistry('OvvoRate','0.25'));
  settings.defaultVat=parseInt(readRegistry('DefaultVat',20),10);
  if(isNaN(settings.kiraLimit)||settings.kiraLimit<=0)settings.kiraLimit=46000;
  if(isNaN(settings.atlasRate)||settings.atlasRate<0)settings.atlasRate=0.20;
  if(isNaN(settings.ovvoRate)||settings.ovvoRate<0)settings.ovvoRate=0.25;
  if(isNaN(settings.defaultVat))settings.defaultVat=20;
  document.getElementById('settingLimit').value=settings.kiraLimit;
  document.getElementById('settingAtlas').value=formatRate(settings.atlasRate);
  document.getElementById('settingOvvo').value=formatRate(settings.ovvoRate);
  document.getElementById('settingVat').value=String(settings.defaultVat);
  setDefaultVat();calculateKKEG();calculateYansitma();calculateKiralik();calculateKdv();calculateStopaj();calculateTevkifat();refreshStartupStatus();renderAbbreviationList();
}
function saveSettings(){
  var limit=parseAmount(document.getElementById('settingLimit').value),a=parseAmount(document.getElementById('settingAtlas').value),o=parseAmount(document.getElementById('settingOvvo').value),v=parseInt(document.getElementById('settingVat').value,10);
  if(limit<=0){alert('Kiralık araç limitini kontrol et.');return;}
  if(a<0||o<0){alert('Yansıtma oranlarını kontrol et.');return;}
  try{
    writeRegistry('KiraLimit',String(limit),'REG_SZ');
    writeRegistry('AtlasRate',String(a),'REG_SZ');
    writeRegistry('OvvoRate',String(o),'REG_SZ');
    writeRegistry('DefaultVat',v,'REG_DWORD');
  }catch(e){
    alert('Ayarlar Windows kayıt defterine kaydedilemedi. Hata: '+e.message);
    return;
  }
  settings={kiraLimit:limit,atlasRate:a,ovvoRate:o,defaultVat:v};
  setDefaultVat();calculateKKEG();calculateYansitma();calculateKiralik();
  var x=document.getElementById('saved');x.style.display='block';setTimeout(function(){x.style.display='none';},1800);
}
function resetSettings(){
  if(!confirm('Tüm ayarlar varsayılan değerlere dönsün mü?'))return;
  deleteRegistryValue('KiraLimit');deleteRegistryValue('AtlasRate');deleteRegistryValue('OvvoRate');deleteRegistryValue('DefaultVat');
  settings={kiraLimit:46000,atlasRate:0.20,ovvoRate:0.25,defaultVat:20};
  loadSettings();
}

function getAppPath(){
  try{return decodeURIComponent(String(location.pathname)).replace(/^\//,'').replace(/\//g,'\\');}catch(e){return String(location.pathname).replace(/^\//,'').replace(/\//g,'\\');}
}
function getStartupLinkPath(){
  var shell=new ActiveXObject('WScript.Shell');
  return shell.SpecialFolders('Startup')+'\\AYK Muhasebe Yardımcısı.lnk';
}
function fileExists(path){
  try{var fso=new ActiveXObject('Scripting.FileSystemObject');return fso.FileExists(path);}catch(e){return false;}
}
function refreshStartupStatus(){
  try{document.getElementById('autoStart').checked=fileExists(getStartupLinkPath());}catch(e){}
}
function setAutoStart(enabled){
  try{
    var shell=new ActiveXObject('WScript.Shell'),fso=new ActiveXObject('Scripting.FileSystemObject'),linkPath=getStartupLinkPath();
    if(enabled){
      var shortcut=shell.CreateShortcut(linkPath),appPath=getAppPath(),folder=fso.GetParentFolderName(appPath);
      shortcut.TargetPath=shell.ExpandEnvironmentStrings('%SystemRoot%\\System32\\mshta.exe');
      shortcut.Arguments='"'+appPath+'"';
      shortcut.WorkingDirectory=folder;
      shortcut.IconLocation=folder+'\\AYK.ico,0';
      shortcut.Description='AYK Muhasebe Yardımcısı';
      shortcut.Save();
    }else if(fso.FileExists(linkPath)){fso.DeleteFile(linkPath,true);}
    refreshStartupStatus();
    document.getElementById('startupSaved').style.display='block';
    document.getElementById('startupSaved').innerText=enabled?'Windows başlangıcında otomatik açılacak.':'Otomatik başlatma kapatıldı.';
    setTimeout(function(){document.getElementById('startupSaved').style.display='none';},2200);
  }catch(e){
    alert('Otomatik başlatma ayarı değiştirilemedi. Program klasörünü yazılabilir bir konuma çıkarıp tekrar dene.');
    refreshStartupStatus();
  }
}
function createDesktopShortcut(){
  try{
    var shell=new ActiveXObject('WScript.Shell'),fso=new ActiveXObject('Scripting.FileSystemObject'),appPath=getAppPath(),folder=fso.GetParentFolderName(appPath);
    var shortcut=shell.CreateShortcut(shell.SpecialFolders('Desktop')+'\\AYK Muhasebe Yardımcısı.lnk');
    shortcut.TargetPath=shell.ExpandEnvironmentStrings('%SystemRoot%\\System32\\mshta.exe');
    shortcut.Arguments='"'+appPath+'"';shortcut.WorkingDirectory=folder;shortcut.IconLocation=folder+'\\AYK.ico,0';shortcut.Description='AYK Muhasebe Yardımcısı';shortcut.Save();
    alert('Masaüstü kısayolu oluşturuldu.');
  }catch(e){alert('Masaüstü kısayolu oluşturulamadı.');}
}

function turkishUpper(s){
  return String(s||'').replace(/i/g,'İ').replace(/ı/g,'I').replace(/ş/g,'Ş').replace(/ğ/g,'Ğ').replace(/ü/g,'Ü').replace(/ö/g,'Ö').replace(/ç/g,'Ç').toUpperCase();
}
function turkishLower(s){
  return String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').replace(/Ş/g,'ş').replace(/Ğ/g,'ğ').replace(/Ü/g,'ü').replace(/Ö/g,'ö').replace(/Ç/g,'ç').toLowerCase();
}
function titleWord(s){
  s=turkishLower(s);
  return s.length?turkishUpper(s.charAt(0))+s.substr(1):'';
}
function getTitleMode(){
  var r=document.getElementsByName('unvanMode');
  for(var i=0;i<r.length;i++)if(r[i].checked)return r[i].value;
  return 'upper';
}
function encodeAbbreviations(){
  var parts=[],k;
  for(k in userAbbreviations)if(userAbbreviations.hasOwnProperty(k))parts[parts.length]=encodeURIComponent(k)+'='+encodeURIComponent(userAbbreviations[k]);
  return parts.join('|');
}
function loadUserAbbreviations(){
  userAbbreviations={};
  var raw=String(readRegistry('UserAbbreviations','')||''),parts,i,p,key,val;
  if(!raw)return;
  parts=raw.split('|');
  for(i=0;i<parts.length;i++){
    p=parts[i].indexOf('=');
    if(p<1)continue;
    try{key=decodeURIComponent(parts[i].substr(0,p));val=decodeURIComponent(parts[i].substr(p+1));if(key&&val)userAbbreviations[key]=val;}catch(e){}
  }
}
function saveUserAbbreviations(){
  try{writeRegistry('UserAbbreviations',encodeAbbreviations(),'REG_SZ');return true;}catch(e){alert('Kısaltma sözlüğü kaydedilemedi. Hata: '+e.message);return false;}
}
function normalizeDictionaryWord(v){return turkishUpper(String(v||'').replace(/^\s+|\s+$/g,'').replace(/[.]+$/,''));}
function normalizeDictionaryAbbr(v){return turkishUpper(String(v||'').replace(/^\s+|\s+$/g,''));}
function addOrUpdateAbbreviation(){
  var word=normalizeDictionaryWord(document.getElementById('dictWord').value),abbr=normalizeDictionaryAbbr(document.getElementById('dictAbbr').value);
  if(!word||!abbr){alert('Kelime ve kısaltma alanlarını doldur.');return;}
  if(editingAbbreviation&&editingAbbreviation!=word)delete userAbbreviations[editingAbbreviation];
  userAbbreviations[word]=abbr;
  if(!saveUserAbbreviations())return;
  editingAbbreviation='';document.getElementById('dictWord').value='';document.getElementById('dictAbbr').value='';document.getElementById('dictSave').innerText='Ekle';
  renderAbbreviationList();fixTitles();
}
function editAbbreviation(word){
  editingAbbreviation=word;document.getElementById('dictWord').value=word;document.getElementById('dictAbbr').value=userAbbreviations[word];document.getElementById('dictSave').innerText='Güncelle';document.getElementById('dictWord').focus();
}
function cancelAbbreviationEdit(){editingAbbreviation='';document.getElementById('dictWord').value='';document.getElementById('dictAbbr').value='';document.getElementById('dictSave').innerText='Ekle';}
function deleteAbbreviation(word){
  if(!confirm(word+' kısaltması silinsin mi?'))return;delete userAbbreviations[word];if(!saveUserAbbreviations())return;cancelAbbreviationEdit();renderAbbreviationList();fixTitles();
}
function htmlEscape(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function jsQuote(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function renderAbbreviationList(){
  var box=document.getElementById('dictionaryList');if(!box)return;
  var q=turkishUpper(document.getElementById('dictSearch').value||''),keys=[],k,i,html='';
  for(k in userAbbreviations)if(userAbbreviations.hasOwnProperty(k)&&(q==''||k.indexOf(q)>-1||turkishUpper(userAbbreviations[k]).indexOf(q)>-1))keys[keys.length]=k;
  keys.sort();
  if(!keys.length)html='<div class="dictionary-empty">Henüz kullanıcı kısaltması yok.</div>';
  else for(i=0;i<keys.length;i++){k=keys[i];html+='<div class="dictionary-item"><div class="dictionary-word">'+htmlEscape(k)+'</div><div class="dictionary-abbr">'+htmlEscape(userAbbreviations[k])+'</div><button class="mini-button" onclick="editAbbreviation(\''+jsQuote(k)+'\')">Düzenle</button><button class="mini-button danger" onclick="deleteAbbreviation(\''+jsQuote(k)+'\')">Sil</button></div>';}
  box.innerHTML=html;document.getElementById('dictStats').innerText='Kullanıcı kısaltması: '+keys.length+' / Toplam kayıt: '+countUserAbbreviations();
}
function countUserAbbreviations(){var n=0,k;for(k in userAbbreviations)if(userAbbreviations.hasOwnProperty(k))n++;return n;}

function formatCustomTitle(s){var parts=String(s||'').split('.'),out=[],i;for(i=0;i<parts.length;i++)if(parts[i]!=='' )out[out.length]=titleWord(parts[i]);return out.join('.')+(String(s).charAt(String(s).length-1)=='.'?'.':'');}
function fixTitleLine(line){
  var upperMap={'SANAYİ':'SAN.','TİCARET':'TİC.','LİMİTED':'LTD.','ŞİRKETİ':'ŞTİ.','ŞİRKET':'ŞTİ.','ANONİM':'A.','İNŞAAT':'İNŞ.','TAAHHÜT':'TAAH.','TURİZM':'TUR.','OTOMOTİV':'OTO.','GIDA':'GID.','İMALAT':'İML.','İTHALAT':'İTH.','İHRACAT':'İHR.','PAZARLAMA':'PAZ.','NAKLİYAT':'NAK.','HAYVANCILIK':'HAY.','MADENCİLİK':'MAD.','PETROL':'PET.','ENERJİ':'ENJ.','TEKSTİL':'TEKS.','ELEKTRİK':'ELK.','ELEKTRONİK':'ELKTR.','MAKİNA':'MAK.','MAKİNE':'MAK.','MÜHENDİSLİK':'MÜH.','MÜŞAVİRLİK':'MÜŞ.','DANIŞMANLIK':'DAN.','LOJİSTİK':'LOJ.','ORGANİZASYON':'ORG.','REKLAMCILIK':'REK.','TEMİZLİK':'TMZ.','GÜVENLİK':'GÜV.','SAĞLIK':'SAĞ.'};
  var titleMap={'SANAYİ':'San.','TİCARET':'Tic.','LİMİTED':'Ltd.','ŞİRKETİ':'Şti.','ŞİRKET':'Şti.','ANONİM':'A.','İNŞAAT':'İnş.','TAAHHÜT':'Taah.','TURİZM':'Tur.','OTOMOTİV':'Oto.','GIDA':'Gıd.','İMALAT':'İml.','İTHALAT':'İth.','İHRACAT':'İhr.','PAZARLAMA':'Paz.','NAKLİYAT':'Nak.','HAYVANCILIK':'Hay.','MADENCİLİK':'Mad.','PETROL':'Pet.','ENERJİ':'Enj.','TEKSTİL':'Teks.','ELEKTRİK':'Elk.','ELEKTRONİK':'Elktr.','MAKİNA':'Mak.','MAKİNE':'Mak.','MÜHENDİSLİK':'Müh.','MÜŞAVİRLİK':'Müş.','DANIŞMANLIK':'Dan.','LOJİSTİK':'Loj.','ORGANİZASYON':'Org.','REKLAMCILIK':'Rek.','TEMİZLİK':'Tmz.','GÜVENLİK':'Güv.','SAĞLIK':'Sağ.'};
  var mode=getTitleMode(),map=mode=='upper'?upperMap:titleMap,k,custom;
  for(k in userAbbreviations)if(userAbbreviations.hasOwnProperty(k)){custom=userAbbreviations[k];map[k]=mode=='upper'?turkishUpper(custom):formatCustomTitle(custom);}
  line=String(line||'').replace(/[	 ]+/g,' ').replace(/^\s+|\s+$/g,'');
  if(!line)return '';
  var words=line.split(' '),out='',prevAbbr=false,i,w,u,isAbbr,piece;
  for(i=0;i<words.length;i++){
    w=words[i].replace(/^[,;:]+|[,;:]+$/g,'').replace(/\.+$/,''); if(!w)continue;
    u=turkishUpper(w);
    if(u=='VE'||u=='İLE'||u=='VEYA'){piece=mode=='upper'?u:turkishLower(u);out+=(out?' ':'')+piece;prevAbbr=false;continue;}
    isAbbr=map[u]!==undefined; piece=isAbbr?map[u]:(mode=='upper'?u:titleWord(w));
    if(!out)out=piece; else if(isAbbr&&prevAbbr)out+=piece; else out+=' '+piece; prevAbbr=isAbbr;
  }
  out=out.replace(/A\.ŞTİ.\./g,'A.Ş.').replace(/A\.Şti.\./g,'A.ş.'); return out;
}
function fixTitles(){
  var input=document.getElementById('unvanInput').value.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  var lines=input.split('\n'),out=[],i;
  for(i=0;i<lines.length;i++)out[out.length]=fixTitleLine(lines[i]);
  document.getElementById('unvanOutput').innerText=out.join('\r\n');
}
function copyTitles(){var t=document.getElementById('unvanOutput').innerText;if(!t){alert('Önce bir ünvan dönüştür.');return;}copyText(t,'Düzeltilmiş ünvanlar kopyalandı.');}
function clearTitles(){document.getElementById('unvanInput').value='';document.getElementById('unvanOutput').innerText='';document.getElementById('unvanInput').focus();}


function getSelectNumber(id){return parseFloat(document.getElementById(id).value)||0;}
function calculateKdv(){var amount=parseAmount(document.getElementById('kdvInput').value),rate=getSelectNumber('kdvRate')/100,mode=document.getElementById('kdvMode').value,base=0,vat=0,total=0;if(mode=='base'){base=amount;vat=base*rate;total=base+vat;}else if(mode=='total'){total=amount;base=rate>0?total/(1+rate):total;vat=total-base;}else{vat=amount;base=rate>0?vat/rate:0;total=base+vat;}document.getElementById('kdvBase').innerText=money(base);document.getElementById('kdvAmount').innerText=money(vat);document.getElementById('kdvTotal').innerText=money(total);}
function clearKdv(){document.getElementById('kdvInput').value='';calculateKdv();document.getElementById('kdvInput').focus();}
function copyKdv(){copyText('KDV HESAPLAMA\r\n\r\nMatrah: '+document.getElementById('kdvBase').innerText+'\r\nKDV: '+document.getElementById('kdvAmount').innerText+'\r\nKDV Dahil: '+document.getElementById('kdvTotal').innerText,'KDV sonuçları kopyalandı.');}
function calculateStopaj(){var gross=parseAmount(document.getElementById('stopajInput').value),rate=getSelectNumber('stopajRate')/100,withholding=gross*rate,net=gross-withholding;document.getElementById('stopajGross').innerText=money(gross);document.getElementById('stopajAmount').innerText=money(withholding);document.getElementById('stopajNet').innerText=money(net);}
function clearStopaj(){document.getElementById('stopajInput').value='';calculateStopaj();document.getElementById('stopajInput').focus();}
function copyStopaj(){copyText('STOPAJ HESAPLAMA\r\n\r\nBrüt: '+document.getElementById('stopajGross').innerText+'\r\nStopaj: '+document.getElementById('stopajAmount').innerText+'\r\nNet: '+document.getElementById('stopajNet').innerText,'Stopaj sonuçları kopyalandı.');}
function calculateTevkifat(){var base=parseAmount(document.getElementById('tevkifatInput').value),vatRate=getSelectNumber('tevkifatVat')/100,ratio=getSelectNumber('tevkifatRate')/10,vat=base*vatRate,held=vat*ratio,payableVat=vat-held,invoiceTotal=base+vat,collection=base+payableVat;document.getElementById('tevkifatVatAmount').innerText=money(vat);document.getElementById('tevkifatHeld').innerText=money(held);document.getElementById('tevkifatPayableVat').innerText=money(payableVat);document.getElementById('tevkifatInvoice').innerText=money(invoiceTotal);document.getElementById('tevkifatCollection').innerText=money(collection);}
function clearTevkifat(){document.getElementById('tevkifatInput').value='';calculateTevkifat();document.getElementById('tevkifatInput').focus();}
function copyTevkifat(){copyText('KDV TEVKİFAT HESAPLAMA\r\n\r\nHesaplanan KDV: '+document.getElementById('tevkifatVatAmount').innerText+'\r\nTevkif Edilen KDV: '+document.getElementById('tevkifatHeld').innerText+'\r\nSatıcıya Ödenecek KDV: '+document.getElementById('tevkifatPayableVat').innerText+'\r\nFatura Genel Toplamı: '+document.getElementById('tevkifatInvoice').innerText+'\r\nTahsil Edilecek Tutar: '+document.getElementById('tevkifatCollection').innerText,'Tevkifat sonuçları kopyalandı.');}


var excelFormulas=[
 {name:'KDV Hariçten Dahile',cat:'Muhasebe',tags:'kdv matrah dahil yüzde 20',formula:'=A2*(1+20%)',desc:'KDV hariç tutara %20 KDV ekler.',example:'A2=1.000 ise sonuç 1.200'},
 {name:'KDV Dahilden Matraha',cat:'Muhasebe',tags:'kdv dahil matrah yüzde 20',formula:'=A2/1,20',desc:'%20 KDV dahil tutarın matrahını bulur.',example:'A2=1.200 ise sonuç 1.000'},
 {name:'KDV Tutarı',cat:'Muhasebe',tags:'kdv dahil vergi yüzde 20',formula:'=A2-A2/1,20',desc:'%20 KDV dahil tutarın içindeki KDV’yi bulur.',example:'A2=1.200 ise sonuç 200'},
 {name:'Yüzde Hesaplama',cat:'Muhasebe',tags:'oran komisyon yüzde',formula:'=A2*B2%',desc:'A2 tutarının B2 hücresindeki yüzdesini hesaplar.',example:'A2=10.000, B2=20 ise 2.000'},
 {name:'KKEG %30',cat:'Muhasebe',tags:'kkeg gider yüzde 30',formula:'=A2*30%',desc:'Girilen tutarın %30 KKEG kısmını hesaplar.',example:'A2=1.000 ise sonuç 300'},
 {name:'DÜŞEYARA',cat:'Arama',tags:'düşeyara vlookup cari kod bul',formula:'=DÜŞEYARA(A2;$F$2:$H$100;3;0)',desc:'A2 değerini ilk sütunda arar ve üçüncü sütundaki karşılığını getirir.',example:'Cari koddan ünvan veya bakiye bulma'},
 {name:'XLOOKUP / ÇAPRAZARA',cat:'Arama',tags:'xlookup çaprazara yeni excel',formula:'=ÇAPRAZARA(A2;$F$2:$F$100;$H$2:$H$100;"Bulunamadı")',desc:'Aranan değerin karşılığını belirtilen dönüş aralığından getirir.',example:'DÜŞEYARA’nın daha esnek alternatifi'},
 {name:'İNDİS + KAÇINCI',cat:'Arama',tags:'indis kaçıncı arama',formula:'=İNDİS($H$2:$H$100;KAÇINCI(A2;$F$2:$F$100;0))',desc:'Aranan değerin satırını bulup karşılık gelen sonucu döndürür.',example:'Sola doğru aramalarda da kullanılabilir'},
 {name:'EĞER',cat:'Mantıksal',tags:'eğer if koşul',formula:'=EĞER(A2>0;"VAR";"YOK")',desc:'Koşul doğruysa VAR, değilse YOK yazar.',example:'Bakiye kontrolü'},
 {name:'EĞERHATA',cat:'Mantıksal',tags:'eğerhata iferror hata',formula:'=EĞERHATA(DÜŞEYARA(A2;$F$2:$H$100;3;0);"")',desc:'Formül hata verirse boş sonuç döndürür.',example:'#YOK hatalarını gizleme'},
 {name:'VE',cat:'Mantıksal',tags:'ve and çoklu koşul',formula:'=EĞER(VE(A2>0;B2="Aktif");"UYGUN";"DEĞİL")',desc:'Birden fazla koşulun aynı anda doğru olup olmadığını denetler.',example:'Tutar ve durum kontrolü'},
 {name:'VEYA',cat:'Mantıksal',tags:'veya or koşul',formula:'=EĞER(VEYA(A2="Nakit";A2="Kart");"ÖDENDİ";"BEKLİYOR")',desc:'Koşullardan en az biri doğruysa işlem yapar.',example:'Ödeme türü kontrolü'},
 {name:'TOPLA',cat:'Toplama',tags:'topla sum toplam',formula:'=TOPLA(A2:A100)',desc:'Belirtilen aralıktaki sayıları toplar.',example:'Fatura tutarları toplamı'},
 {name:'ETOPLA',cat:'Toplama',tags:'etopla sumif şarta göre',formula:'=ETOPLA(B2:B100;"Satış";C2:C100)',desc:'B sütununda Satış olan satırların C tutarlarını toplar.',example:'İşlem türüne göre toplam'},
 {name:'ÇOKETOPLA',cat:'Toplama',tags:'çoketopla sumifs birden fazla şart',formula:'=ÇOKETOPLA(D2:D100;B2:B100;"Satış";C2:C100;">=01.01.2026")',desc:'Birden fazla koşula uyan tutarları toplar.',example:'Tarih ve işlem türüne göre toplam'},
 {name:'EĞERSAY',cat:'Toplama',tags:'eğersay countif say',formula:'=EĞERSAY(B2:B100;"Ödendi")',desc:'Belirtilen koşula uyan hücre sayısını verir.',example:'Ödenmiş fatura adedi'},
 {name:'ÇOKEĞERSAY',cat:'Toplama',tags:'çokeğersay countifs çoklu şart',formula:'=ÇOKEĞERSAY(B2:B100;"Ödendi";C2:C100;">1000")',desc:'Birden fazla koşula uyan satırları sayar.',example:'1.000 TL üstü ödenmiş faturalar'},
 {name:'TOPLA.ÇARPIM',cat:'Toplama',tags:'topla çarpım sumproduct',formula:'=TOPLA.ÇARPIM(A2:A100;B2:B100)',desc:'Karşılıklı hücreleri çarpıp sonuçları toplar.',example:'Miktar × birim fiyat toplamı'},
 {name:'BİRLEŞTİR',cat:'Metin',tags:'birleştir concatenate metin',formula:'=A2&" - "&B2',desc:'İki hücredeki metni araya tire koyarak birleştirir.',example:'Cari kod - ünvan'},
 {name:'SOLDAN',cat:'Metin',tags:'soldan left metin',formula:'=SOLDAN(A2;3)',desc:'Metnin soldan ilk 3 karakterini getirir.',example:'Kodun ilk üç hanesi'},
 {name:'SAĞDAN',cat:'Metin',tags:'sağdan right metin',formula:'=SAĞDAN(A2;4)',desc:'Metnin sağdan son 4 karakterini getirir.',example:'Belge numarasının son dört hanesi'},
 {name:'PARÇAAL',cat:'Metin',tags:'parçaal mid metin',formula:'=PARÇAAL(A2;5;8)',desc:'Metnin 5. karakterinden başlayarak 8 karakter alır.',example:'Sabit konumdaki kodu ayırma'},
 {name:'UZUNLUK',cat:'Metin',tags:'uzunluk len karakter',formula:'=UZUNLUK(A2)',desc:'Hücredeki karakter sayısını verir.',example:'Vergi numarası uzunluk kontrolü'},
 {name:'BÜYÜKHARF',cat:'Metin',tags:'büyükharf upper ünvan',formula:'=BÜYÜKHARF(A2)',desc:'Metnin tamamını büyük harfe çevirir.',example:'Firma ünvanı düzenleme'},
 {name:'KIRP',cat:'Temizleme',tags:'kırp trim boşluk temizle',formula:'=KIRP(A2)',desc:'Başta, sonda ve aradaki gereksiz boşlukları temizler.',example:'Kopyalanan cari ünvanları temizleme'},
 {name:'TEMİZ',cat:'Temizleme',tags:'temiz clean görünmez karakter',formula:'=TEMİZ(A2)',desc:'Yazdırılamayan ve görünmez karakterleri kaldırır.',example:'Sistemden aktarılan bozuk metinler'},
 {name:'YİNELE',cat:'Temizleme',tags:'yinelenen tekrar duplicate koşullu',formula:'=EĞERSAY($A$2:A2;A2)>1',desc:'Koşullu biçimlendirmede tekrar eden değerleri bulmak için kullanılır.',example:'Mükerrer fatura numarası kontrolü'},
 {name:'BUGÜN',cat:'Tarih',tags:'bugün today tarih',formula:'=BUGÜN()',desc:'Günün tarihini getirir.',example:'Rapor tarihi'},
 {name:'ŞİMDİ',cat:'Tarih',tags:'şimdi now saat tarih',formula:'=ŞİMDİ()',desc:'Güncel tarih ve saati getirir.',example:'İşlem zaman damgası'},
 {name:'AYSONU',cat:'Tarih',tags:'ayson eomonth ay sonu',formula:'=AYSONU(A2;0)',desc:'A2 tarihinin bulunduğu ayın son gününü verir.',example:'Vade ay sonu'},
 {name:'TARİH',cat:'Tarih',tags:'tarih date yıl ay gün',formula:'=TARİH(YIL(A2);AY(A2);1)',desc:'A2 tarihinin ait olduğu ayın ilk gününü üretir.',example:'Aylık gruplama'},
 {name:'GÜN360',cat:'Tarih',tags:'gün360 days360 vade faiz',formula:'=GÜN360(A2;B2)',desc:'İki tarih arasındaki gün sayısını 360 günlük yıl esasına göre hesaplar.',example:'Ticari vade ve faiz hesabı'}
];
function normalizeExcelSearch(v){return turkishUpper(String(v||'').replace(/^\s+|\s+$/g,''));}
function copyExcelFormula(index){if(index<0||index>=excelFormulas.length)return;copyText(excelFormulas[index].formula,excelFormulas[index].name+' formülü kopyalandı.');}
function clearExcelFilters(){document.getElementById('excelSearch').value='';document.getElementById('excelCategory').value='Tümü';renderExcelFormulas();document.getElementById('excelSearch').focus();}
function renderExcelFormulas(){
  var box=document.getElementById('excelFormulaList');if(!box)return;
  var q=normalizeExcelSearch(document.getElementById('excelSearch').value),cat=document.getElementById('excelCategory').value,html='',shown=0,i,f,hay;
  for(i=0;i<excelFormulas.length;i++){
    f=excelFormulas[i];hay=normalizeExcelSearch(f.name+' '+f.cat+' '+f.tags+' '+f.desc+' '+f.example);
    if(cat!='Tümü'&&f.cat!=cat)continue;if(q&&hay.indexOf(q)<0)continue;
    html+='<div class="formula-card"><div class="formula-top"><div><div class="formula-name">'+htmlEscape(f.name)+'</div><span class="formula-category">'+htmlEscape(f.cat)+'</span></div><button class="formula-copy" onclick="copyExcelFormula('+i+')">Kopyala</button></div><div class="formula-code">'+htmlEscape(f.formula)+'</div><div class="formula-desc">'+htmlEscape(f.desc)+'</div><div class="formula-example"><b>Örnek:</b> '+htmlEscape(f.example)+'</div></div>';shown++;
  }
  if(!shown)html='<div class="dictionary-empty">Aramana uygun formül bulunamadı.</div>';
  box.innerHTML=html;document.getElementById('excelCount').innerText=shown+' formül gösteriliyor';
}

function keyHandler(){if(window.event&&window.event.keyCode==13){if(activeTab=='kkegPage')calculateKKEG();else if(activeTab=='yansitmaPage')calculateYansitma();else if(activeTab=='kiralikPage')calculateKiralik();else if(activeTab=='unvanPage')fixTitles();else if(activeTab=='kdvPage')calculateKdv();else if(activeTab=='stopajPage')calculateStopaj();else if(activeTab=='tevkifatPage')calculateTevkifat();else saveSettings();}}