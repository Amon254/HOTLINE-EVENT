import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Building2, CreditCard, Calendar,
  CheckCircle, XCircle, Clock, RefreshCw, Crown, MapPin,
  MessageSquare, AlertCircle, ChevronRight, Shield,
  BarChart2, DollarSign, UserCheck, UserX, Eye, ArrowUpRight,
  ArrowDownRight, Minus, Search, Edit3, Trash2, Plus,
} from 'lucide-react';
import { UsersTab, UserModal, VenueModal, ReviewsTab, CategoriesTab, PlansTab, act, confirmDo } from './AdminTools';

const fmt    = (n) => new Intl.NumberFormat("fr-CI").format(n || 0);
const fmtDt  = (d) => d ? new Date(d).toLocaleDateString("fr-CI",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmtFull= (d) => d ? new Date(d).toLocaleString("fr-CI",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "—";
const COLORS  = ["#1B6B4A","#0A0E0C","#34D399","#6B7280","#86EFAC","#15803D","#9CA3AF","#065F46"];
const OP_LOGOS= {wave:"🌊",orange_money:"🟠",mtn_money:"🟡",moov_money:"🔵"};

const STATUS_VENUE={active:{label:"Actif",bg:"#E8F5EE",color:"#1B6B4A"},pending:{label:"En attente",bg:"#F1F5F3",color:"#14532D"},inactive:{label:"Inactif",bg:"#F3F4F6",color:"#6B7280"}};
const STATUS_RES={pending:{label:"En attente",bg:"#F1F5F3",color:"#14532D"},confirmed:{label:"Confirmée",bg:"#E8F5EE",color:"#1B6B4A"},cancelled:{label:"Annulée",bg:"#FEF2F2",color:"#dc2626"},completed:{label:"Terminée",bg:"#F3F4F6",color:"#6B7280"}};
const STATUS_PAY={pending:{label:"En attente",bg:"#F1F5F3",color:"#14532D"},confirmed:{label:"Confirmé",bg:"#E8F5EE",color:"#1B6B4A"},rejected:{label:"Rejeté",bg:"#FEF2F2",color:"#dc2626"}};

function Badge({status,map}){const s=map[status]||{label:status,bg:"#F3F4F6",color:"#6B7280"};return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,color:s.color,whiteSpace:"nowrap"}}>{s.label}</span>;}

function Sparkline({data,color="#1B6B4A",h=36}){
  if(!data||data.length<2)return null;
  const max=Math.max(...data,1),w=100;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-(v/max)*h*0.85-2}`).join(" ");
  return <svg width={w} height={h} style={{overflow:"visible"}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function LineChart({data,labelKey,series,height=200}){
  if(!data||!data.length)return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:"#9CA3AF",fontSize:13}}>Pas encore de données</div>;
  const all=series.flatMap(s=>data.map(d=>d[s.key]||0));
  const max=Math.max(...all,1);
  const W=Math.max(data.length*48,350),H=height;
  const pathFor=k=>data.map((d,i)=>{const x=36+(i/(data.length-1))*(W-44);const y=H-((d[k]||0)/max)*H*0.85-4;return `${i===0?"M":"L"}${x},${y}`;}).join(" ");
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H+48}>
        {[0.25,0.5,0.75,1].map(f=>(
          <g key={f}>
            <line x1={30} x2={W} y1={H-f*H*0.85} y2={H-f*H*0.85} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3"/>
            <text x={26} y={H-f*H*0.85+4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmt(Math.round(max*f))}</text>
          </g>
        ))}
        {series.map((s,si)=>(
          <g key={si}>
            <path d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {data.map((d,i)=>{const x=36+(i/(data.length-1))*(W-44);const y=H-((d[s.key]||0)/max)*H*0.85-4;return <circle key={i} cx={x} cy={y} r="3" fill={s.color}><title>{d[labelKey]}: {fmt(d[s.key])}</title></circle>;})}
          </g>
        ))}
        {data.map((d,i)=>{const x=36+(i/(data.length-1))*(W-44);return <text key={i} x={x} y={H+18} fontSize={9} fill="#6B7280" textAnchor="middle">{(d[labelKey]||"").slice(0,6)}</text>;})}
      </svg>
      <div style={{display:"flex",gap:14,marginTop:6}}>
        {series.map(s=><div key={s.key} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#6B7280"}}><div style={{width:12,height:3,borderRadius:2,background:s.color}}/>{s.label}</div>)}
      </div>
    </div>
  );
}

function BarChart({data,labelKey,valueKey,color="#1B6B4A",height=160,secondKey,secondColor="#34D399"}){
  if(!data||!data.length)return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:"#9CA3AF",fontSize:13}}>Pas encore de données</div>;
  const max=Math.max(...data.map(d=>Math.max(d[valueKey]||0,d[secondKey]||0)),1);
  const bw=Math.min(30,Math.floor(560/data.length)-6);
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={Math.max(data.length*(bw+6)+44,320)} height={height+40}>
        {[0.25,0.5,0.75,1].map(f=>(
          <g key={f}>
            <line x1={34} x2={Math.max(data.length*(bw+6)+44,320)} y1={height-f*height*0.85} y2={height-f*height*0.85} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3"/>
            <text x={28} y={height-f*height*0.85+4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmt(Math.round(max*f))}</text>
          </g>
        ))}
        {data.map((d,i)=>{
          const x=36+i*(bw+6);
          const bh=((d[valueKey]||0)/max)*height*0.85;
          const b2h=secondKey?((d[secondKey]||0)/max)*height*0.85:0;
          return(
            <g key={i}>
              <rect x={x} y={height-bh} width={secondKey?bw*0.55:bw} height={bh} rx={3} fill={color} opacity={0.85}><title>{d[labelKey]}: {fmt(d[valueKey])}</title></rect>
              {secondKey&&<rect x={x+bw*0.55+1} y={height-b2h} width={bw*0.45} height={b2h} rx={3} fill={secondColor} opacity={0.85}><title>{d[labelKey]}: {fmt(d[secondKey])}</title></rect>}
              <text x={x+bw/2} y={height+14} fontSize={9} fill="#6B7280" textAnchor="middle">{(d[labelKey]||"").slice(0,5)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({data,labelKey,valueKey}){
  if(!data||!data.length)return <div style={{color:"#9CA3AF",fontSize:13,textAlign:"center",padding:20}}>Pas encore de données</div>;
  const total=data.reduce((s,d)=>s+(d[valueKey]||0),0)||1;
  let angle=-Math.PI/2;
  const R=58,cx=75,cy=75;
  return(
    <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <svg width={150} height={150}>
        {data.map((d,i)=>{
          const slice=((d[valueKey]||0)/total)*2*Math.PI;
          if(slice===0)return null;
          const x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
          const x2=cx+R*Math.cos(angle+slice),y2=cy+R*Math.sin(angle+slice);
          const large=slice>Math.PI?1:0;
          const path=`M${cx},${cy} L${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} Z`;
          angle+=slice;
          return <path key={i} d={path} fill={COLORS[i%COLORS.length]} opacity={0.88}><title>{d[labelKey]}: {d[valueKey]} ({Math.round((d[valueKey]/total)*100)}%)</title></path>;
        })}
        <circle cx={cx} cy={cy} r={R*0.55} fill="#fff"/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1a1a18">{total}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {data.map((d,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:12}}>
            <div style={{width:10,height:10,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0}}/>
            <span style={{color:"#5C5C52"}}>{d[labelKey]}</span>
            <span style={{fontWeight:700,marginLeft:"auto",paddingLeft:8}}>{d[valueKey]}</span>
            <span style={{color:"#9CA3AF",fontSize:10}}>({Math.round((d[valueKey]/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({icon,value,label,sub,color="#1B6B4A",trend,sparkData}){
  return(
    <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",border:"1px solid var(--border)",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{width:40,height:40,borderRadius:12,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",color}}>{icon}</div>
        {trend!==undefined&&<span style={{fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:3,color:trend===0?"#6B7280":trend>0?"#1B6B4A":"#dc2626",background:trend===0?"#F3F4F6":trend>0?"#E8F5EE":"#FEF2F2",padding:"2px 8px",borderRadius:20}}>
          {trend===0?<Minus size={10}/>:trend>0?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{Math.abs(trend)}%
        </span>}
      </div>
      <div style={{fontSize:"1.6rem",fontWeight:800,color:"#1a1a18",lineHeight:1}}>{value}</div>
      <div style={{fontSize:12,color:"#8C8C80",marginTop:4}}>{label}</div>
      {sub&&<div style={{fontSize:11,color,marginTop:4,fontWeight:500}}>{sub}</div>}
      {sparkData&&sparkData.length>1&&<div style={{marginTop:8}}><Sparkline data={sparkData} color={color}/></div>}
    </div>
  );
}

function ChartCard({title,subtitle,children,action}){
  return(
    <div style={{background:"#fff",borderRadius:16,padding:"20px 22px",border:"1px solid var(--border)",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h3 style={{fontSize:"0.95rem",fontWeight:700,margin:0}}>{title}</h3>
          {subtitle&&<p style={{fontSize:12,color:"#8C8C80",marginTop:3,marginBottom:0}}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function AdminPage(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const [tab,setTab]=useState("dashboard");
  const [stats,setStats]=useState(null);
  const [charts,setCharts]=useState(null);
  const [users,setUsers]=useState([]);
  const [venues,setVenues]=useState([]);
  const [payments,setPayments]=useState([]);
  const [reservations,setReservations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("");
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectReason,setRejectReason]=useState("");
  const [userModal,setUserModal]=useState(null);   // null | "new" | user
  const [venueModal,setVenueModal]=useState(null);
  const [cats,setCats]=useState([]);
  const [theme,setThemeState]=useState(()=>{try{return localStorage.getItem("adm_theme")||"light";}catch(_){return "light";}});
  const setTheme=(t)=>{setThemeState(t);try{localStorage.setItem("adm_theme",t);}catch(_){}};

  useEffect(()=>{
    if(!user||(!user.is_staff&&user.role!=="admin")){navigate("/");return;}
    loadAll();
  },[user]); // eslint-disable-line

  const loadAll=async()=>{
    setLoading(true);
    try{
      const [s,ch,u,v,p,r,ct]=await Promise.all([
        apiClient.get("/admin-panel/stats/"),
        apiClient.get("/admin-panel/charts/"),
        apiClient.get("/admin-panel/users/"),
        apiClient.get("/admin-panel/venues/"),
        apiClient.get("/admin-panel/payments/"),
        apiClient.get("/admin-panel/reservations/"),
        apiClient.get("/admin-panel/categories/"),
      ]);
      setStats(s.data);setCharts(ch.data);setUsers(u.data);setVenues(v.data);setPayments(p.data);setReservations(r.data);setCats(ct.data);
    }catch(e){toast.error("Erreur chargement");}
    finally{setLoading(false);}
  };

  const reload=useCallback(async(section)=>{
    const map={users:["/admin-panel/users/",setUsers],venues:["/admin-panel/venues/",setVenues],payments:["/admin-panel/payments/",setPayments],reservations:["/admin-panel/reservations/",setReservations],stats:["/admin-panel/stats/",setStats],charts:["/admin-panel/charts/",setCharts]};
    if(map[section]){const[url,set]=map[section];const{data}=await apiClient.get(url);set(data);}
  },[]);

  const toggleUserActive=async(id,cur)=>{await apiClient.patch(`/admin-panel/users/${id}/`,{is_active:!cur});toast.success(cur?"Suspendu":"Réactivé");reload("users");};
  const toggleVenueStatus=async(id,cur)=>{const next=cur==="active"?"inactive":"active";await apiClient.patch(`/admin-panel/venues/${id}/`,{status:next});toast.success(`Lieu ${next==="active"?"activé":"désactivé"}`);reload("venues");reload("stats");};
  const toggleFeatured=async(id,cur)=>{await apiClient.patch(`/admin-panel/venues/${id}/`,{is_featured:!cur});toast.success(cur?"Retiré vedettes":"⭐ Mis en vedette");reload("venues");};
  const approveVenue=async(id)=>{await apiClient.patch(`/admin-panel/venues/${id}/`,{status:"active"});toast.success("✅ Lieu approuvé");reload("venues");reload("stats");};
  const confirmPayment=async(id)=>{await apiClient.post(`/admin-panel/payments/${id}/confirm/`,{});toast.success("✅ Abonnement activé");reload("payments");reload("stats");reload("charts");};
  const rejectPayment=async()=>{await apiClient.post(`/admin-panel/payments/${rejectModal}/reject/`,{reason:rejectReason});toast.success("Rejeté");setRejectModal(null);setRejectReason("");reload("payments");};

  const pendingPay=payments.filter(p=>p.status==="pending");
  const pendingVen=venues.filter(v=>v.status==="pending");
  const filteredUsers=users.filter(u=>(!filterStatus||u.role===filterStatus)&&(!search||`${u.username}${u.email}${u.first_name}${u.last_name}`.toLowerCase().includes(search.toLowerCase())));
  const filteredVenues=venues.filter(v=>(!filterStatus||v.status===filterStatus)&&(!search||v.name.toLowerCase().includes(search.toLowerCase())));
  const filteredPay=payments.filter(p=>!filterStatus||p.status===filterStatus);
  const filteredRes=reservations.filter(r=>!filterStatus||r.status===filterStatus);

  const GROUPS={dashboard:"Pilotage",payments:"Gestion",reviews:"Plateforme"};
  const TITLES={dashboard:"Vue d'ensemble",analytics:"Analytics",payments:"Paiements",venues:"Lieux",users:"Utilisateurs",reservations:"Réservations",reviews:"Avis",categories:"Catégories",plans:"Plans d'abonnement"};
  const TABS=[
    {id:"dashboard",   label:"Dashboard",    icon:<LayoutDashboard size={15}/>, badge:null},
    {id:"analytics",   label:"Analytics",    icon:<BarChart2 size={15}/>,       badge:null},
    {id:"payments",    label:"Paiements",    icon:<CreditCard size={15}/>,      badge:pendingPay.length||null},
    {id:"venues",      label:"Lieux",        icon:<Building2 size={15}/>,       badge:pendingVen.length||null},
    {id:"users",       label:"Utilisateurs", icon:<Users size={15}/>,           badge:null},
    {id:"reservations",label:"Réservations", icon:<Calendar size={15}/>,        badge:null},
    {id:"reviews",     label:"Avis",         icon:<MessageSquare size={15}/>,   badge:null},
    {id:"categories",  label:"Catégories",   icon:<Building2 size={15}/>,       badge:null},
    {id:"plans",       label:"Plans",        icon:<Crown size={15}/>,           badge:null},
  ];

  if(loading)return(<div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",flexDirection:"column",gap:16}}><div className="spinner"/><p style={{color:"#9CA3AF",fontSize:14}}>Chargement…</p></div>);

  const sparkUsers =charts?.users_by_month?.map(d=>d.total)||[];
  const sparkSubs  =charts?.mrr_by_month?.map(d=>d.subscribers)||[];
  const sparkRev   =charts?.revenue_by_month?.map(d=>d.total)||[];
  const sparkRes   =charts?.res_by_month?.map(d=>d.total)||[];

  return(
    <div className={`adm adm-${theme}`} style={{minHeight:"100vh",background:"#F4F6F5",display:"flex"}}>
      <style>{`
        .adm{font-family:Inter,system-ui,sans-serif;color:#0A0E0C}
        .adm h1,.adm h2,.adm h3{font-family:Inter,system-ui,sans-serif;letter-spacing:-.02em}
        .adm table th{background:#F4F6F5!important}
        .adm table tr:hover td{background:#F7FAF8}
        .adm .input{border-radius:10px}
        .adm-green{background:#EAF2ED!important}
        .adm-green .adm-side{background:#0F3D2B!important}
        .adm-green .adm-head{background:rgba(255,255,255,.9)!important}
        .adm-dark{background:#0B0F0D!important;color:#E8ECEA;--border:#242C28;--surface:#0F1411;--surface-2:#1A211E;--text-primary:#E8ECEA;--text-secondary:#B4BDB8;--text-muted:#8A948F;--white:#141A17}
        .adm-dark .adm-side{background:#050807!important}
        .adm-dark .adm-head{background:rgba(11,15,13,.92)!important;border-color:#242C28!important}
        .adm-dark [style*="rgb(255, 255, 255)"]{background:#141A17!important;border-color:#242C28!important}
        .adm-dark [style*="rgb(26, 26, 24)"]{color:#E8ECEA!important}
        .adm-dark [style*="rgb(92, 92, 82)"],.adm-dark [style*="rgb(107, 114, 128)"]{color:#B4BDB8!important}
        .adm-dark table th{background:#1A211E!important}
        .adm-dark table tr:hover td{background:#1A211E}
        .adm-dark table td,.adm-dark table tr{background:transparent!important;border-color:#242C28!important}
        .adm-dark .input{background:#0F1411;color:#E8ECEA;border-color:#242C28}
        .adm-dark .btn-ghost{color:#E8ECEA;border-color:#242C28;background:transparent}
        .adm-dark circle[fill="#fff"]{fill:#141A17}
        .adm-nav:hover{background:rgba(255,255,255,.06)!important;color:#fff!important}
      `}</style>

      {/* SIDEBAR */}
      <aside className="adm-side" style={{width:220,background:"#0A0E0C",flexShrink:0,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Shield size={20} color="#34D399"/>
            <div>
              <div style={{color:"#fff",fontWeight:700,fontSize:14}}>EventHotline</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:11}}>Administrateur du panel</div>
            </div>
          </div>
        </div>

        {(pendingPay.length>0||pendingVen.length>0)&&(
          <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            {pendingPay.length>0&&<div onClick={()=>setTab("payments")} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:"rgba(201,168,76,0.15)",borderRadius:8,marginBottom:6,cursor:"pointer"}}><AlertCircle size={12} color="#34D399"/><span style={{fontSize:11,color:"#34D399",fontWeight:600}}>{pendingPay.length} paiement{pendingPay.length>1?"s":""} à valider</span></div>}
            {pendingVen.length>0&&<div onClick={()=>setTab("venues")} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:"rgba(255,255,255,0.06)",borderRadius:8,cursor:"pointer"}}><AlertCircle size={12} color="rgba(255,255,255,0.4)"/><span style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:500}}>{pendingVen.length} lieu{pendingVen.length>1?"x":""} à approuver</span></div>}
          </div>
        )}

        <nav style={{flex:1,padding:"8px 10px"}}>
          {TABS.map((t,i)=>{
            const group=GROUPS[t.id];
            return(
            <React.Fragment key={t.id}>
              {group&&<div style={{fontSize:10,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",fontWeight:700,padding:i===0?"6px 12px 6px":"16px 12px 6px"}}>{group}</div>}
              <button className="adm-nav" onClick={()=>{setTab(t.id);setSearch("");setFilterStatus("");}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",borderLeft:`3px solid ${tab===t.id?"#34D399":"transparent"}`,cursor:"pointer",marginBottom:2,textAlign:"left",background:tab===t.id?"rgba(255,255,255,0.09)":"transparent",color:tab===t.id?"#fff":"rgba(255,255,255,0.6)",fontWeight:tab===t.id?600:400,fontSize:13,transition:"all 0.15s"}}>
                <span style={{color:tab===t.id?"#34D399":"rgba(255,255,255,0.4)"}}>{t.icon}</span>
                {t.label}
                {t.badge&&<span style={{marginLeft:"auto",background:"#34D399",color:"#0A0E0C",borderRadius:10,minWidth:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{t.badge}</span>}
              </button>
            </React.Fragment>);
          })}
        </nav>

        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4}}>Connecté en tant que</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontWeight:600}}>{user?.first_name} {user?.last_name}</div>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,0.3)",fontSize:11,textDecoration:"none",marginTop:8}}>← Retour au site</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflow:"auto",minWidth:0}}>
        <header className="adm-head" style={{position:"sticky",top:0,zIndex:20,background:"rgba(255,255,255,.92)",backdropFilter:"blur(8px)",borderBottom:"1px solid #E4E8E6",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{fontSize:13,color:"#6B7280"}}>Administration <span style={{margin:"0 6px"}}>/</span> <b style={{color:"#0A0E0C"}}>{TITLES[tab]}</b></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div role="group" aria-label="Thème" style={{display:"flex",gap:4,padding:3,border:"1px solid #E4E8E6",borderRadius:20,background:"#F4F6F5"}}>
              {[["light","Clair","#FFFFFF"],["green","Vert","#1B6B4A"],["dark","Sombre","#0A0E0C"]].map(([k,l,c])=>(
                <button key={k} type="button" title={`Thème ${l.toLowerCase()}`} aria-pressed={theme===k} onClick={()=>setTheme(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:16,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:theme===k?"#0A0E0C":"transparent",color:theme===k?"#fff":"#6B7280"}}>
                  <span style={{width:12,height:12,borderRadius:"50%",background:c,border:"1.5px solid #9CA3AF",display:"inline-block"}}/>{l}
                </button>))}
            </div>
            <Link to="/" target="_blank" className="btn btn-ghost btn-sm">Voir le site</Link>
            <div title={user?.email} style={{width:32,height:32,borderRadius:"50%",background:"#0A0E0C",color:"#34D399",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>{(user?.first_name||user?.username||"A").charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <div style={{padding:24}}>

        {/* DASHBOARD */}
        {tab==="dashboard"&&stats&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><h1 style={{fontSize:"1.4rem",margin:0,fontWeight:800}}>Vue d'ensemble</h1><p style={{color:"#9CA3AF",fontSize:12,marginTop:2}}>{fmtFull(new Date())}</p></div>
              <button className="btn btn-ghost btn-sm" onClick={loadAll}><RefreshCw size={13}/> Actualiser</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,marginBottom:22}}>
              <StatCard icon={<Users size={18}/>}        value={fmt(stats.users.total)}                label="Utilisateurs"          sub={`+${stats.users.new_week} cette semaine`}     color="#0A0E0C" trend={stats.users.growth} sparkData={sparkUsers}/>
              <StatCard icon={<Building2 size={18}/>}    value={stats.venues.active}                   label="Lieux actifs"           sub={`${stats.venues.pending} en attente`}          color="#1B6B4A" sparkData={sparkRes}/>
              <StatCard icon={<Crown size={18}/>}        value={stats.subscriptions.pro_active}         label="Abonnés Pro"            sub={`MRR: ${fmt(stats.subscriptions.mrr)} FCFA`}  color="#34D399" sparkData={sparkSubs}/>
              <StatCard icon={<DollarSign size={18}/>}   value={`${fmt(stats.reservations.revenue)} F`} label="CA Réservations"        sub={`${stats.reservations.confirmed} confirmées`}  color="#1B6B4A" sparkData={sparkRev}/>
              <StatCard icon={<CreditCard size={18}/>}   value={stats.subscriptions.pending_payments}   label="Paiements à valider"    sub="Cliquez pour traiter"                          color="#1B6B4A"/>
              <StatCard icon={<MessageSquare size={18}/>} value={stats.messaging.conversations}         label="Conversations"          sub={`${stats.messaging.new_week} msgs/semaine`}    color="#4B5563"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <ChartCard title="💳 Paiements à valider" subtitle={`${pendingPay.length} en attente`} action={<button className="btn btn-ghost btn-sm" onClick={()=>setTab("payments")}>Voir tout <ChevronRight size={12}/></button>}>
                {pendingPay.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#9CA3AF",fontSize:13}}>✅ Aucun paiement en attente</div>:pendingPay.slice(0,4).map(p=>(
                  <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{p.user} <span style={{fontSize:14}}>{OP_LOGOS[p.method]}</span></div><div style={{fontSize:11,color:"#9CA3AF"}}>{fmt(p.amount)} FCFA · {p.months} mois</div></div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn btn-primary btn-sm" onClick={()=>confirmPayment(p.id)} style={{fontSize:11,padding:"4px 9px"}}>✅</button>
                      <button className="btn btn-sm" onClick={()=>setRejectModal(p.id)} style={{fontSize:11,padding:"4px 9px",background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}>✕</button>
                    </div>
                  </div>
                ))}
              </ChartCard>
              <ChartCard title="🏛️ Lieux à approuver" subtitle={`${pendingVen.length} en attente`} action={<button className="btn btn-ghost btn-sm" onClick={()=>setTab("venues")}>Voir tout <ChevronRight size={12}/></button>}>
                {pendingVen.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#9CA3AF",fontSize:13}}>✅ Aucun lieu en attente</div>:pendingVen.slice(0,4).map(v=>(
                  <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{v.name}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{v.city} · {v.manager}</div></div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn btn-primary btn-sm" onClick={()=>approveVenue(v.id)} style={{fontSize:11,padding:"4px 9px"}}>✅ OK</button>
                      <button className="btn btn-ghost btn-sm" title="Modifier" onClick={()=>setVenueModal(v)} style={{fontSize:11,padding:"4px 8px"}}><Edit3 size={11}/></button>
                          <Link to={`/lieux/${v.slug}`} target="_blank" className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"4px 8px"}}><Eye size={11}/></Link>
                          <button className="btn btn-sm" title="Supprimer" onClick={async()=>{if(confirmDo(`Supprimer "${v.name}" ?`)&&await act(()=>apiClient.delete(`/admin-panel/venues/${v.id}/`),"Lieu supprimé")){reload("venues");reload("stats");}}} style={{fontSize:11,padding:"4px 8px",background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}><Trash2 size={11}/></button>
                    </div>
                  </div>
                ))}
              </ChartCard>
            </div>
            {charts&&charts.top_venues&&charts.top_venues.length>0&&(
              <ChartCard title="🏆 Top lieux par vues">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {charts.top_venues.map((v,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--surface)",borderRadius:8}}>
                      <span style={{width:22,height:22,borderRadius:"50%",background:i<3?"#34D399":"#E5E7EB",color:i<3?"#fff":"#6B7280",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
                      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{v.district||v.city}</div></div>
                      <span style={{fontSize:12,fontWeight:700,color:"#1B6B4A",flexShrink:0}}>👁 {fmt(v.views_count)}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {tab==="analytics"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h1 style={{fontSize:"1.4rem",margin:0,fontWeight:800}}>Analytics & Tendances</h1>
              <button className="btn btn-ghost btn-sm" onClick={()=>{reload("charts");reload("stats");}}><RefreshCw size={13}/></button>
            </div>
            {!charts?<div style={{textAlign:"center",padding:60,color:"#9CA3AF"}}>Chargement des graphiques…</div>:(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                  <ChartCard title="📈 MRR — Revenu mensuel récurrent" subtitle="Évolution 12 mois (FCFA)">
                    <LineChart data={charts.mrr_by_month} labelKey="label" series={[{key:"mrr",label:"MRR (FCFA)",color:"#34D399"}]} height={180}/>
                  </ChartCard>
                  <ChartCard title="👑 Abonnés Pro actifs" subtitle="Évolution 12 mois">
                    <LineChart data={charts.mrr_by_month} labelKey="label" series={[{key:"subscribers",label:"Abonnés Pro",color:"#1B6B4A"}]} height={180}/>
                  </ChartCard>
                </div>
                <div style={{marginBottom:16}}>
                  <ChartCard title="👥 Inscriptions par mois" subtitle="Clients vs Gestionnaires sur 12 mois">
                    <LineChart data={charts.users_by_month} labelKey="month" series={[{key:"total",label:"Total",color:"#0A0E0C"},{key:"clients",label:"Clients",color:"#1B6B4A"},{key:"managers",label:"Gestionnaires",color:"#34D399"}]} height={200}/>
                  </ChartCard>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                  <ChartCard title="📅 Réservations par mois" subtitle="Total vs Confirmées">
                    <BarChart data={charts.res_by_month} labelKey="month" valueKey="total" secondKey="confirmed" color="#1B6B4A" secondColor="#1B6B4A" height={160}/>
                    <div style={{display:"flex",gap:14,marginTop:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6B7280"}}><div style={{width:10,height:10,borderRadius:2,background:"#1B6B4A"}}/> Total</div>
                      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6B7280"}}><div style={{width:10,height:10,borderRadius:2,background:"#1B6B4A"}}/> Confirmées</div>
                    </div>
                  </ChartCard>
                  <ChartCard title="💰 Revenus paiements confirmés" subtitle="FCFA par mois">
                    <BarChart data={charts.revenue_by_month} labelKey="month" valueKey="total" color="#34D399" height={160}/>
                  </ChartCard>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
                  <ChartCard title="🏛️ Lieux par catégorie">
                    <DonutChart data={charts.venues_by_cat} labelKey="name" valueKey="total"/>
                  </ChartCard>
                  <ChartCard title="💳 Méthodes de paiement">
                    <DonutChart data={(charts.payments_by_method||[]).map(p=>({name:{wave:"Wave",orange_money:"Orange Money",mtn_money:"MTN Money",moov_money:"Moov Money"}[p.method]||p.method,total:p.total}))} labelKey="name" valueKey="total"/>
                  </ChartCard>
                  <ChartCard title="🎉 Types d'événements">
                    <DonutChart data={charts.res_by_type} labelKey="type" valueKey="total"/>
                  </ChartCard>
                  <ChartCard title="👤 Répartition utilisateurs">
                    <DonutChart data={(charts.users_by_role||[]).map(r=>({name:{client:"Clients",manager:"Gestionnaires",admin:"Admins"}[r.role]||r.role,total:r.total}))} labelKey="name" valueKey="total"/>
                  </ChartCard>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAIEMENTS */}
        {tab==="payments"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h1 style={{fontSize:"1.4rem",margin:0,fontWeight:800}}>Paiements ({payments.length})</h1>
              <button className="btn btn-ghost btn-sm" onClick={()=>reload("payments")}><RefreshCw size={13}/></button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {["","pending","confirmed","rejected"].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,cursor:"pointer",border:`1.5px solid ${filterStatus===s?"var(--brand-green)":"var(--border)"}`,background:filterStatus===s?"#E8F5EE":"#fff",color:filterStatus===s?"var(--brand-green)":"var(--text-secondary)",fontWeight:filterStatus===s?600:400}}>
                  {s===""?"Tous":STATUS_PAY[s]?.label}
                  {s==="pending"&&pendingPay.length>0&&<span style={{marginLeft:5,background:"#dc2626",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{pendingPay.length}</span>}
                </button>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"var(--surface-2)",borderBottom:"1px solid var(--border)"}}>
                  {["Utilisateur","Opérateur","Montant","Durée","Transaction","Date","Statut","Actions"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#9CA3AF",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredPay.map((p,i)=>(
                    <tr key={p.id} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"#fff":"var(--surface)"}}>
                      <td style={{padding:"11px 14px"}}><div style={{fontSize:13,fontWeight:600}}>{p.user}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{p.user_email}</div>{p.sender_phone&&<div style={{fontSize:11,color:"#9CA3AF"}}>📞 {p.sender_phone}</div>}</td>
                      <td style={{padding:"11px 14px",fontSize:15}}>{OP_LOGOS[p.method]||"💳"} <span style={{fontSize:12,color:"#6B7280"}}>{p.method_label}</span></td>
                      <td style={{padding:"11px 14px",fontWeight:700,color:"#1B6B4A",fontSize:13,whiteSpace:"nowrap"}}>{fmt(p.amount)} FCFA</td>
                      <td style={{padding:"11px 14px",fontSize:13}}>{p.months} mois</td>
                      <td style={{padding:"11px 14px"}}><code style={{fontSize:11,background:"var(--surface-2)",padding:"2px 6px",borderRadius:4}}>{p.transaction_id||"—"}</code></td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}>{fmtDt(p.created_at)}</td>
                      <td style={{padding:"11px 14px"}}><Badge status={p.status} map={STATUS_PAY}/></td>
                      <td style={{padding:"11px 14px"}}>
                        {p.status==="pending"&&<div style={{display:"flex",gap:5}}><button className="btn btn-primary btn-sm" onClick={()=>confirmPayment(p.id)} style={{fontSize:11,padding:"4px 9px",whiteSpace:"nowrap"}}>✅ Confirmer</button><button className="btn btn-sm" onClick={()=>setRejectModal(p.id)} style={{fontSize:11,padding:"4px 9px",background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}>✕</button></div>}
                        <button className="btn btn-sm" title="Supprimer" onClick={async()=>{if(confirmDo("Supprimer ce paiement ?")&&await act(()=>apiClient.delete(`/admin-panel/payments/${p.id}/`),"Paiement supprimé")){reload("payments");reload("stats");}}} style={{fontSize:11,padding:"3px 7px",marginTop:4,background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}><Trash2 size={10}/></button>
                        {p.screenshot&&<a href={p.screenshot} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#1B6B4A",display:"flex",alignItems:"center",gap:3,marginTop:4}}><Eye size={10}/> Capture</a>}
                        {p.status!=="pending"&&!p.screenshot&&<span style={{color:"#9CA3AF",fontSize:12}}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPay.length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9CA3AF",fontSize:13}}>Aucun paiement</div>}
            </div>
          </div>
        )}

        {/* LIEUX */}
        {tab==="venues"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h1 style={{fontSize:"1.4rem",margin:0,fontWeight:800}}>Lieux ({venues.length})</h1>
              <button className="btn btn-ghost btn-sm" onClick={()=>reload("venues")}><RefreshCw size={13}/></button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <div style={{position:"relative",flex:"1 1 200px"}}><Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#9CA3AF"}}/><input className="input" style={{paddingLeft:30,height:36,fontSize:13}} placeholder="Chercher…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
              {["","active","pending","inactive"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,cursor:"pointer",border:`1.5px solid ${filterStatus===s?"var(--brand-green)":"var(--border)"}`,background:filterStatus===s?"#E8F5EE":"#fff",color:filterStatus===s?"var(--brand-green)":"var(--text-secondary)",fontWeight:filterStatus===s?600:400}}>{s===""?"Tous":STATUS_VENUE[s]?.label}{s==="pending"&&pendingVen.length>0&&<span style={{marginLeft:5,background:"#1B6B4A",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{pendingVen.length}</span>}</button>)}
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"var(--surface-2)",borderBottom:"1px solid var(--border)"}}>
                  {["Lieu","Gestionnaire","Localisation","Prix/jour","Stats","Vedette","Statut","Actions"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#9CA3AF",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredVenues.map((v,i)=>(
                    <tr key={v.id} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"#fff":"var(--surface)"}}>
                      <td style={{padding:"11px 14px"}}><div style={{fontSize:13,fontWeight:600}}>{v.name}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{v.category} · {v.capacity_max} pers.</div></td>
                      <td style={{padding:"11px 14px",fontSize:13}}>{v.manager}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}><MapPin size={10} style={{display:"inline",marginRight:3}}/>{v.district?`${v.district}, `:""}{v.city}</td>
                      <td style={{padding:"11px 14px",fontWeight:600,fontSize:13,whiteSpace:"nowrap"}}>{fmt(v.price_per_day)} F</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#9CA3AF"}}><div>👁 {fmt(v.views_count)}</div><div>📅 {v.res_count}</div>{v.average_rating&&<div>⭐ {v.average_rating}</div>}</td>
                      <td style={{padding:"11px 14px",textAlign:"center"}}><button onClick={()=>toggleFeatured(v.id,v.is_featured)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{v.is_featured?"⭐":"☆"}</button></td>
                      <td style={{padding:"11px 14px"}}><Badge status={v.status} map={STATUS_VENUE}/></td>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {v.status==="pending"&&<button className="btn btn-primary btn-sm" onClick={()=>approveVenue(v.id)} style={{fontSize:11,padding:"4px 9px",whiteSpace:"nowrap"}}>✅ Approuver</button>}
                          <button className="btn btn-sm" onClick={()=>toggleVenueStatus(v.id,v.status)} style={{fontSize:11,padding:"4px 9px",whiteSpace:"nowrap",background:v.status==="active"?"#FEF2F2":"#E8F5EE",color:v.status==="active"?"#dc2626":"#1B6B4A",border:`1px solid ${v.status==="active"?"#fca5a5":"#86efac"}`}}>{v.status==="active"?"⏸":"▶"}</button>
                          <Link to={`/lieux/${v.slug}`} target="_blank" className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"4px 8px"}}><Eye size={11}/></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVenues.length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9CA3AF",fontSize:13}}>Aucun lieu</div>}
            </div>
          </div>
        )}

        {/* UTILISATEURS */}
        {tab==="users"&&<UsersTab users={users} me={user} onReload={()=>{reload("users");reload("stats");}} onEdit={setUserModal} onCreate={()=>setUserModal("new")}/>}

        {/* RESERVATIONS */}
        {tab==="reservations"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h1 style={{fontSize:"1.4rem",margin:0,fontWeight:800}}>Réservations ({reservations.length})</h1>
              <button className="btn btn-ghost btn-sm" onClick={()=>reload("reservations")}><RefreshCw size={13}/></button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {["","pending","confirmed","cancelled","completed"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,cursor:"pointer",border:`1.5px solid ${filterStatus===s?"var(--brand-green)":"var(--border)"}`,background:filterStatus===s?"#E8F5EE":"#fff",color:filterStatus===s?"var(--brand-green)":"var(--text-secondary)",fontWeight:filterStatus===s?600:400}}>{s===""?"Toutes":STATUS_RES[s]?.label}</button>)}
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"var(--surface-2)",borderBottom:"1px solid var(--border)"}}>
                  {["Lieu","Client","Date événement","Invités","Montant","Demandé le","Statut","Actions"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#9CA3AF",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredRes.map((r,i)=>(
                    <tr key={r.id} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"#fff":"var(--surface)"}}>
                      <td style={{padding:"11px 14px"}}><Link to={`/lieux/${r.venue_slug}`} target="_blank" style={{fontSize:13,fontWeight:600,color:"#1B6B4A",textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>{r.venue} <ArrowUpRight size={10}/></Link></td>
                      <td style={{padding:"11px 14px"}}><div style={{fontSize:13,fontWeight:600}}>{r.client}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{r.client_email}</div></td>
                      <td style={{padding:"11px 14px",fontSize:13,whiteSpace:"nowrap"}}>{fmtDt(r.event_date)}</td>
                      <td style={{padding:"11px 14px",fontSize:13}}>{r.guests_count} pers.</td>
                      <td style={{padding:"11px 14px",fontWeight:700,color:"#1B6B4A",fontSize:13,whiteSpace:"nowrap"}}>{fmt(r.total_price)} FCFA</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}>{fmtDt(r.created_at)}</td>
                      <td style={{padding:"11px 14px"}}><Badge status={r.status} map={STATUS_RES}/></td>
                      <td style={{padding:"11px 14px",display:"flex",gap:6}}>
                        <select className="input" style={{height:30,fontSize:12,width:120}} value={r.status} onChange={async e=>{if(await act(()=>apiClient.patch(`/admin-panel/reservations/${r.id}/`,{status:e.target.value}),"Statut mis à jour")){reload("reservations");reload("stats");}}}>
                          {Object.keys(STATUS_RES).map(k=><option key={k} value={k}>{STATUS_RES[k].label}</option>)}
                        </select>
                        <button className="btn btn-sm" title="Supprimer" onClick={async()=>{if(confirmDo("Supprimer cette réservation ?")&&await act(()=>apiClient.delete(`/admin-panel/reservations/${r.id}/`),"Supprimée")){reload("reservations");reload("stats");}}} style={{fontSize:11,padding:"4px 8px",background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}><Trash2 size={11}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRes.length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9CA3AF",fontSize:13}}>Aucune réservation</div>}
            </div>
          </div>
        )}
        {tab==="reviews"&&<ReviewsTab/>}
        {tab==="categories"&&<CategoriesTab onChange={setCats}/>}
        {tab==="plans"&&<PlansTab/>}
        </div>
      </main>

      {userModal&&<UserModal user={userModal==="new"?null:userModal} me={user} onClose={()=>setUserModal(null)} onDone={()=>{reload("users");reload("stats");}}/>}
      {venueModal&&<VenueModal venue={venueModal} users={users} categories={cats} onClose={()=>setVenueModal(null)} onDone={()=>{reload("venues");reload("stats");}}/>}

      {/* MODAL REJET */}
      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:420,width:"100%"}}>
            <h3 style={{marginBottom:12}}>❌ Rejeter ce paiement</h3>
            <textarea className="input" rows={3} placeholder="Raison (optionnel)…" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} style={{marginBottom:14,resize:"vertical"}}/>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-sm" onClick={rejectPayment} style={{flex:1,justifyContent:"center",background:"#FEF2F2",color:"#dc2626",border:"1px solid #fca5a5"}}>Confirmer le rejet</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setRejectModal(null);setRejectReason("");}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}