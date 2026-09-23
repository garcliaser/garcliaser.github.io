/* Ajuste pontual autorizado: primeira sessão do Treino A de 23/09/2026.
   Corrige APENAS a duração, preservando séries, pesos, repetições e demais dados.
   Também normaliza cópias antigas recebidas pela sincronização/importação. */
(() => {
  'use strict';
  const KEY='g_hist_A';
  const SESSION='2026-09-23T21:49:40.985Z';
  const NEW_MS=70*60*1000;
  const original=Storage.prototype.setItem;
  function fix(value){
    if(typeof value!=='string'||value.indexOf(SESSION)<0)return value;
    try{
      const list=JSON.parse(value);
      if(!Array.isArray(list))return value;
      let changed=false;
      for(const s of list){
        if(s&&s.date===SESSION&&Number(s.duration)>10800000&&Number(s.duration)<11200000){
          s.duration=NEW_MS;
          changed=true;
        }
      }
      return changed?JSON.stringify(list):value;
    }catch(_){return value}
  }
  Storage.prototype.setItem=function(key,value){
    if(String(key)===KEY)value=fix(String(value));
    return original.call(this,key,value);
  };
  try{
    const old=localStorage.getItem(KEY);
    if(old!=null){
      const next=fix(old);
      if(next!==old)localStorage.setItem(KEY,next);
    }
  }catch(_){}
})();