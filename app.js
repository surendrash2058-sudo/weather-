const API = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const $ = (id) => document.getElementById(id);
let currentUnit = "celsius";
let latestWeather = null;
let latestPlace = null;

const weatherInfo = (code, isDay = true) => {
  if (code === 0) return {label:"Clear sky",icon:isDay?"☀️":"🌙"};
  if ([1,2].includes(code)) return {label:code===1?"Mainly clear":"Partly cloudy",icon:isDay?"🌤️":"☁️"};
  if (code === 3) return {label:"Overcast",icon:"☁️"};
  if ([45,48].includes(code)) return {label:"Foggy",icon:"🌫️"};
  if ([51,53,55,56,57].includes(code)) return {label:"Drizzle",icon:"🌦️"};
  if ([61,63,65,66,67,80,81,82].includes(code)) return {label:"Rain",icon:"🌧️"};
  if ([71,73,75,77,85,86].includes(code)) return {label:"Snow",icon:"❄️"};
  if ([95,96,99].includes(code)) return {label:"Thunderstorm",icon:"⛈️"};
  return {label:"Changeable",icon:"🌤️"};
};
const temp = (value) => value == null ? "--°" : Math.round(currentUnit==="celsius"?value:value*9/5+32)+"°";
const windValue = (value) => value == null ? "--" : Math.round(currentUnit==="celsius"?value:value*0.621371)+(currentUnit==="celsius"?" km/h":" mph");
const dayName = (date, options={weekday:"short"}) => new Intl.DateTimeFormat(undefined,options).format(new Date(date+"T12:00:00"));
function setStatus(message, error=false){$("status").textContent=message;$("status").style.color=error?"#ffaaa8":"#91a2c2";}
function render(){
  if(!latestWeather||!latestPlace)return;
  const w=latestWeather,c=w.current,d=w.daily,h=w.hourly;
  const now=new Date();
  $("placeName").textContent=[latestPlace.name,latestPlace.admin1,latestPlace.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", ");
  $("localDate").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(now);
  $("temperature").innerHTML=temp(c.temperature_2m).replace("°","<span>°</span>");
  const info=weatherInfo(c.weather_code,c.is_day===1);
  $("condition").textContent=info.label;$("weatherVisual").textContent=info.icon;
  $("feelsLike").textContent="Feels like "+temp(c.apparent_temperature);
  $("todayHigh").textContent=temp(d.temperature_2m_max[0]);$("todayLow").textContent=temp(d.temperature_2m_min[0]);
  $("humidity").textContent=Math.round(c.relative_humidity_2m)+"%";
  $("wind").textContent=windValue(c.wind_speed_10m);
  $("uv").textContent=d.uv_index_max[0]?.toFixed(1)??"--";
  $("rain").textContent=Math.round(d.precipitation_probability_max[0]??0)+"%";
  $("weekForecast").innerHTML=d.time.map((date,i)=>{
    const wi=weatherInfo(d.weather_code[i]);
    return '<div class="week-row"><span class="week-day">'+(i===0?"Today":dayName(date))+'</span><span class="week-icon">'+wi.icon+'</span><span class="week-desc">'+wi.label+'</span><span class="week-temps">'+temp(d.temperature_2m_max[i])+' <span>'+temp(d.temperature_2m_min[i])+'</span></span></div>';
  }).join("");
  const start=Math.max(0,h.time.findIndex(t=>new Date(t)>=now));
  $("hourlyForecast").innerHTML=h.time.slice(start,start+24).filter((_,i)=>i%3===0).map((time,j)=>{
    const i=start+j*3, wi=weatherInfo(h.weather_code[i],true);
    const label=i===start?"Now":new Intl.DateTimeFormat(undefined,{hour:"numeric"}).format(new Date(time));
    return '<div class="hour-item"><div class="hour-time">'+label+'</div><div class="hour-icon">'+wi.icon+'</div><div class="hour-temp">'+temp(h.temperature_2m[i])+'</div><div class="hour-rain">💧 '+(h.precipitation_probability[i]??0)+'%</div></div>';
  }).join("");
  $("updatedAt").textContent="Updated "+new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(now);
}
async function loadWeather(place){
  setStatus("Finding the latest forecast…");
  $("searchButton").disabled=true;
  try{
    const url=new URL(API);
    url.search=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",hourly:"temperature_2m,precipitation_probability,weather_code",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",timezone:"auto",forecast_days:"7"}).toString();
    const response=await fetch(url);
    if(!response.ok)throw new Error("Weather service is unavailable. Please try again.");
    latestWeather=await response.json();latestPlace=place;render();
    setStatus("Showing live conditions for "+place.name+".");
  }catch(error){setStatus(error.message||"Could not load weather. Check your connection and try again.",true);}
  finally{$("searchButton").disabled=false;}
}
async function searchCity(query){
  if(!query.trim())return;
  setStatus("Searching for "+query+"…");
  try{
    const url=new URL(GEO);url.search=new URLSearchParams({name:query,count:"1",language:"en",format:"json"}).toString();
    const response=await fetch(url);if(!response.ok)throw new Error("Location search failed.");
    const data=await response.json();
    if(!data.results?.length)throw new Error("City not found. Try another spelling.");
    await loadWeather(data.results[0]);
  }catch(error){setStatus(error.message,true);}
}
$("searchForm").addEventListener("submit",e=>{e.preventDefault();searchCity($("cityInput").value);});
$("locationButton").addEventListener("click",()=>{
  if(!navigator.geolocation){setStatus("Location is not supported by this browser.",true);return;}
  setStatus("Requesting your location…");
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const url=new URL(GEO);url.search=new URLSearchParams({latitude:pos.coords.latitude,longitude:pos.coords.longitude,count:"1",language:"en",format:"json"}).toString();
      const response=await fetch(url);const data=await response.json();
      const place=data.results?.[0]||{name:"Your location",latitude:pos.coords.latitude,longitude:pos.coords.longitude,country:""};
      await loadWeather({...place,latitude:pos.coords.latitude,longitude:pos.coords.longitude});
    }catch{await loadWeather({name:"Your location",latitude:pos.coords.latitude,longitude:pos.coords.longitude});}
  },err=>setStatus(err.code===1?"Location permission was denied. Search for a city instead.":"Could not get your location. Please search for a city.",true),{enableHighAccuracy:false,timeout:10000});
});
$("unitToggle").addEventListener("click",()=>{currentUnit=currentUnit==="celsius"?"fahrenheit":"celsius";$("unitToggle").innerHTML=currentUnit==="celsius"?"°C <span>/</span> °F":"°F <span>/</span> °C";render();});
loadWeather({name:"Seoul",admin1:"Seoul",country:"South Korea",latitude:37.5665,longitude:126.978});
