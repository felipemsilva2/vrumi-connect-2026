
import React from 'react';
import { COMPARISON_DATA } from './constants';
import {
    Mail, ArrowRight, Smartphone, ShieldCheck, MapPin, Star, QrCode, Search,
    Calendar, Car, Wallet, Clock, UserCheck, Sparkles, Sun, Gift, Bike,
    Truck, Bus, Home, User, ChevronRight, Filter
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const dataChart = [
    { name: 'Seg', value: 120 },
    { name: 'Ter', value: 200 },
    { name: 'Qua', value: 150 },
    { name: 'Qui', value: 280 },
    { name: 'Sex', value: 350 },
    { name: 'Sab', value: 450 },
];

interface HubPageProps {
    onJoinWaitlist: () => void;
}

export const HubPage: React.FC<HubPageProps> = ({ onJoinWaitlist }) => {
    return (
        <div className="animate-fade-in-up">

            {/* Hero Section - Aumentado padding-top para limpar o header fixo */}
            <section className="relative pt-28 md:pt-40 pb-20 px-6 overflow-hidden">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-left relative z-10 order-2 md:order-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full mb-6 tracking-widest uppercase animate-pulse">
                                <Sparkles size={14} /> Lançamento em breve
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tighter mb-6">
                                Aprenda a dirigir<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400">com quem você escolhe.</span>
                            </h1>
                            <p className="text-xl text-gray-500 mb-8 max-w-lg leading-relaxed font-medium">
                                O <strong>Vrumi Connect</strong> conecta alunos a instrutores credenciados. Agende aulas, pague com segurança e faça check-in pelo app.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={onJoinWaitlist}
                                    className="bg-black text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all hover:scale-105 shadow-xl"
                                >
                                    Entrar na Lista de Espera <ArrowRight size={18} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('students')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                                >
                                    Como vai funcionar?
                                </button>
                            </div>
                        </div>

                        {/* 3D App Visual - Removido h-[600px] fixo do container para melhor fluxo */}
                        <div className="relative perspective-1000 order-1 md:order-2 flex items-center justify-center">
                            <div className="relative w-[280px] md:w-[300px] h-[580px] md:h-[600px] bg-black rounded-[45px] shadow-[0px_0px_0px_10px_#1f1f1f] border-[8px] border-gray-800 transform rotate-y-[-15deg] rotate-x-[5deg] hover:rotate-y-[0deg] transition-transform duration-700 ease-out group cursor-pointer overflow-hidden ring-1 ring-white/10 z-0">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>

                                {/* App Screen UI */}
                                <div className="absolute inset-0 bg-[#0a121e] flex flex-col overflow-hidden text-white font-sans selection:bg-vrumi">

                                    {/* Header Area */}
                                    <div className="bg-[#004d40] pt-12 pb-6 px-5 rounded-b-[2rem]">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                    <Search size={18} className="text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold">Encontrar Instrutor</h4>
                                                    <p className="text-[10px] opacity-70">Escolha o melhor para você</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
                                                <Sun size={12} className="text-yellow-400" />
                                                <span className="text-[10px] font-bold">28°C</span>
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-black leading-tight mb-6">
                                            Onde você quer<br />ter sua aula?
                                        </h2>

                                        {/* Search Box */}
                                        <div className="bg-[#1a2b3c]/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-vrumi"></div>
                                                <input
                                                    readOnly
                                                    placeholder="Buscar por cidade..."
                                                    className="bg-transparent text-sm w-full outline-none placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div className="h-px bg-white/5 mb-4"></div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                                <input
                                                    readOnly
                                                    placeholder="Selecionar categoria CNH"
                                                    className="bg-transparent text-sm w-full outline-none placeholder:text-gray-500"
                                                />
                                            </div>
                                            <button className="w-full bg-vrumi text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-vrumi-dark transition-all">
                                                <Search size={16} /> Buscar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto px-5 pt-6 space-y-6 hide-scrollbar">

                                        {/* Promo Banner */}
                                        <div className="bg-[#003d33] rounded-2xl p-4 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-[#004d40] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-vrumi/20 rounded-xl flex items-center justify-center text-vrumi">
                                                    <Gift size={20} />
                                                </div>
                                                <span className="text-xs font-bold text-vrumi-light">Primeira aula com 10% OFF!</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-500" />
                                        </div>

                                        {/* Categories */}
                                        <div>
                                            <h5 className="text-sm font-bold mb-4">Categorias CNH</h5>
                                            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                                                {[
                                                    { label: 'Moto', cat: 'A', icon: <Bike size={18} />, active: true },
                                                    { label: 'Carro', cat: 'B', icon: <Car size={18} /> },
                                                    { label: 'Moto+Carro', cat: 'AB', icon: <div className="flex gap-0.5"><Bike size={14} /><Car size={14} /></div> },
                                                    { label: 'Caminhão', cat: 'C', icon: <Truck size={18} /> },
                                                    { label: 'Ônibus', cat: 'D', icon: <Bus size={18} /> },
                                                ].map((item, i) => (
                                                    <div key={i} className={`min-w-[80px] p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${item.active ? 'bg-[#1a2b3c] border-vrumi/30' : 'bg-transparent border-white/5'}`}>
                                                        <div className={item.active ? 'text-vrumi' : 'text-gray-400'}>{item.icon}</div>
                                                        <span className="text-[8px] uppercase tracking-wider opacity-60 font-bold">{item.label}</span>
                                                        <span className={`text-sm font-black ${item.active ? 'text-vrumi' : 'text-white'}`}>{item.cat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div>
                                            <h5 className="text-sm font-bold mb-4">Instrutores disponíveis</h5>
                                            <div className="flex gap-2 mb-6">
                                                <button className="bg-vrumi text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                                    <Star size={12} fill="currentColor" /> Melhor avaliação
                                                </button>
                                                <button className="bg-[#1a2b3c] text-gray-400 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-white/5">
                                                    <Filter size={12} /> Menor preço
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Tab Bar */}
                                    <div className="bg-[#0a121e]/90 backdrop-blur-xl border-t border-white/5 p-4 pb-8 flex justify-around items-center">
                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                            <Home size={20} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Início</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 text-vrumi relative">
                                            <div className="absolute -top-12 w-10 h-1 px-1 bg-vrumi rounded-full blur-sm opacity-50"></div>
                                            <div className="bg-vrumi/10 p-2 rounded-xl mb-1">
                                                <Search size={22} />
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Buscar</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                            <Calendar size={20} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Aulas</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                            <User size={20} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Perfil</span>
                                        </div>
                                    </div>

                                    {/* Overlay "Em Breve" para manter o CTA */}
                                    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center">
                                        <div className="bg-black/60 backdrop-blur-[4px] w-full h-full flex flex-col items-center justify-center p-8 text-center pointer-events-auto">
                                            <div className="w-14 h-14 bg-vrumi/20 rounded-2xl flex items-center justify-center mb-4 border border-vrumi/30">
                                                <Smartphone size={28} className="text-vrumi" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-vrumi mb-2">Beta Privado</span>
                                            <h4 className="text-2xl font-black text-white leading-tight mb-6">Lançamento em breve nas lojas.</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onJoinWaitlist(); }}
                                                className="bg-vrumi text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                            >
                                                Me avise quando liberar
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Highlights */}
            <section className="bg-white py-12 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">

                        <div className="md:col-span-2 md:row-span-2 bg-[#F5F5F7] rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden group">
                            <div className="relative z-10">
                                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6 inline-block shadow-sm text-emerald-600">Marketplace</span>
                                <h3 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                    Encontre o instrutor<br />perfeito.
                                </h3>
                                <p className="text-gray-500 text-lg font-medium max-w-sm">
                                    Filtre por avaliação, preço e proximidade. Veja o carro e agende em segundos.
                                </p>
                            </div>
                            <div className="absolute right-[-50px] bottom-[-50px] w-[300px] h-[300px] bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
                            <div className="absolute right-8 bottom-8 bg-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-float">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Instrutor a 2km</p>
                                    <p className="text-[10px] text-gray-500">Honda Fit • 4.9 ★</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-black text-white rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden">
                            <div className="relative z-10 max-w-md">
                                <span className="text-emerald-400 font-bold text-xs tracking-widest uppercase mb-2 block">Dashboard</span>
                                <h3 className="text-2xl font-bold mb-2">Painel de Controle Completo.</h3>
                                <p className="text-gray-400 text-sm">
                                    Gerencie agenda, ganhos e alunos.
                                </p>
                            </div>
                            <div className="absolute bottom-0 right-0 w-1/2 h-20 opacity-50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dataChart}>
                                        <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-emerald-500 text-white rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20">
                                <QrCode size={100} />
                            </div>
                            <QrCode size={32} className="text-emerald-200 relative z-10" />
                            <div className="relative z-10">
                                <span className="text-3xl font-black tracking-tighter">Check-in</span>
                                <p className="text-emerald-100 font-medium text-sm mt-1">Validação digital da aula.</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 shadow-apple rounded-[2.5rem] p-8 flex flex-col justify-between relative">
                            <div>
                                <span className="text-blue-500 font-bold text-xs tracking-widest uppercase mb-2 block">Verificado</span>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">Segurança Total</h3>
                            </div>
                            <div className="absolute bottom-8 right-8 text-gray-200">
                                <ShieldCheck size={48} />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECTION: FOR STUDENTS */}
            <section id="students" className="py-24 px-6 bg-[#F5F5F7]">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4 block">Para Alunos</span>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                                Liberdade para dirigir.<br />No seu ritmo.
                            </h2>
                            <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                                Aprender a dirigir não precisa ser estressante. O Vrumi Connect é o "Uber" das aulas de direção, conectando você aos melhores profissionais da sua cidade.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Busque e Compare</h4>
                                        <p className="text-gray-500">Filtre por categoria (A, B, C, D, E), localização e preço. Veja fotos do veículo e leia avaliações reais.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Check-in Digital</h4>
                                        <p className="text-gray-500">Ao iniciar a aula, o instrutor apresenta um QR Code e você valida pelo seu app. Segurança total.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Carro Próprio ou do Instrutor?</h4>
                                        <p className="text-gray-500">Habilitado, mas com medo? Contrate aulas no <strong>seu próprio veículo</strong> para ganhar confiança.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            {/* Decorative Abstract Phone/App UI for Students */}
                            <div className="bg-white rounded-[3rem] p-8 shadow-2xl relative z-10 border border-gray-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-bold">Meus Agendamentos</h3>
                                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Próxima Aula</div>
                                </div>
                                <div className="bg-[#F5F5F7] rounded-3xl p-6 mb-4">
                                    <div className="flex gap-4 mb-4">
                                        <div className="w-14 h-14 bg-gray-300 rounded-full overflow-hidden">
                                            <img src="https://ui-avatars.com/api/?name=Carlos+Instrutor&background=random" alt="" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Carlos Eduardo</p>
                                            <p className="text-sm text-gray-500">Honda Civic • Automático</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 font-medium bg-white p-4 rounded-xl">
                                        <span className="flex items-center gap-2"><Calendar size={16} /> Hoje</span>
                                        <span className="flex items-center gap-2"><Clock size={16} /> 14:00 - 14:50</span>
                                    </div>
                                </div>
                                <button onClick={onJoinWaitlist} className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                    <QrCode size={20} /> Realizar Check-in
                                </button>
                            </div>
                            <div className="absolute top-10 right-[-20px] w-full h-full bg-emerald-200 rounded-[3rem] -z-10 blur-xl opacity-40"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION: FOR INSTRUCTORS */}
            <section id="instructors" className="py-24 px-6 bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
                        <div className="flex-1">
                            <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4 block">Para Instrutores</span>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                                Transforme seu carro<br />em uma máquina de renda.
                            </h2>
                            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                                Você é um Instrutor de Trânsito credenciado? O Vrumi Connect é sua ferramenta de gestão completa. Acabe com os cancelamentos de última hora e a inadimplência.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                    <Wallet className="text-emerald-400 mb-4" size={32} />
                                    <h4 className="font-bold text-lg mb-2">Pagamento Garantido</h4>
                                    <p className="text-gray-400 text-sm">O aluno paga ao agendar. O valor é liberado na sua carteira logo após o check-in.</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                    <Calendar className="text-emerald-400 mb-4" size={32} />
                                    <h4 className="font-bold text-lg mb-2">Agenda Flexível</h4>
                                    <p className="text-gray-400 text-sm">Defina seus horários, dias de folga e regiões de atendimento.</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                    <UserCheck className="text-emerald-400 mb-4" size={32} />
                                    <h4 className="font-bold text-lg mb-2">Alunos Verificados</h4>
                                    <p className="text-gray-400 text-sm">Todos os alunos passam por verificação de identidade no app.</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                    <Star className="text-emerald-400 mb-4" size={32} />
                                    <h4 className="font-bold text-lg mb-2">Reputação</h4>
                                    <p className="text-gray-400 text-sm">Construa sua nota e seja recomendado para mais alunos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                                <h3 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-6">Ganhos da Semana</h3>
                                <div className="text-5xl font-bold text-white mb-2">R$ 1.850,00</div>
                                <p className="text-emerald-400 font-medium mb-8 flex items-center gap-2">
                                    <span className="bg-emerald-400/20 px-2 py-0.5 rounded text-xs">+12%</span> vs semana anterior
                                </p>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dataChart}>
                                            <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fill="#10B981" fillOpacity={0.1} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION: SAFETY */}
            <section id="safety" className="py-24 px-6 bg-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                        Segurança em 1º Lugar
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tight">
                        Como verificamos nossos parceiros.
                    </h2>
                    <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
                        Entrar no carro com um desconhecido exige confiança. Por isso, nosso processo de cadastro é o mais rigoroso do mercado.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="font-bold text-gray-900">CNH com EAR</h4>
                            <p className="text-xs text-gray-500">Validação Detran</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="font-bold text-gray-900">Antecedentes</h4>
                            <p className="text-xs text-gray-500">Federal e Estadual</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                <Car size={32} />
                            </div>
                            <h4 className="font-bold text-gray-900">CRLV Veículo</h4>
                            <p className="text-xs text-gray-500">Regularizado</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                <Star size={32} />
                            </div>
                            <h4 className="font-bold text-gray-900">Credencial</h4>
                            <p className="text-xs text-gray-500">Curso de Instrutor</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="bg-[#F5F5F7] py-20 px-6">
                <div className="container mx-auto max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Autoescola Tradicional vs Vrumi</h2>
                        <p className="text-gray-500">Por que modernizar?</p>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                        {COMPARISON_DATA.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-3 border-b border-gray-100 last:border-0 p-5 text-sm md:text-base items-center">
                                <div className="font-semibold text-gray-900">{row.feature}</div>
                                <div className="text-gray-400 text-center text-xs md:text-sm px-2">{row.presencial}</div>
                                <div className="text-emerald-600 font-bold text-right flex justify-end items-center gap-2">
                                    {row.online} <div className="w-2 h-2 rounded-full bg-emerald-500 hidden md:block"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 px-6 bg-white text-center">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tighter">
                        Falta pouco para você dirigir.
                    </h2>
                    <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
                        Cadastre-se para receber um bônus exclusivo no lançamento e ser o primeiro a acessar a plataforma.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onJoinWaitlist}
                            className="bg-black text-white px-10 py-5 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-xl shadow-xl"
                        >
                            Entrar na Lista VIP
                        </button>
                    </div>
                    <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" className="w-8 h-8 invert" alt="Apple" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg" className="w-8 h-8" alt="Android" />
                    </div>
                </div>
            </section>

        </div>
    );
};
