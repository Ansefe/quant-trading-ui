# 🖥️ Trading Suite UI (Vue 3 + Vite)

Frontend institucional y terminal gráfica diseñada para conectarse al **Quant Trading Agent**. Desarrollada en Vue 3 y estilizada puramente con Tailwind CSS, garantizando velocidad y diseño de primera clase. Utiliza `lightweight-charts` nativo de TradingView para la visualización de lienzos renderizados en canvas.

---

## ✨ Características Principales

### 1. 📊 Live Paper Trading Terminal (Tiempo Real)
- **Gráfica Sincronizada Bidireccionalmente**: Velas en vivo procesadas via Websocket (`api.py`) para evitar problemas de latencia e integradas a `lightweight-charts`.
- **Obras Tecnológicas de Trazado de Ondas (Elliott y Fibo)** 🌊: 
  - Dibujo programático en tiempo real de los ciclos algorítmicos de Elliott (12345/ABC).
  - Multi-Temporalidad: Retiro y repintado de trazos limpios al cambiar de temporalidad mediante botones flotantes en la gráfica (15m, 1h, 4h).
  - Trazado virtual de los *PriceLines* horizontal de invalidación del análisis y proyecciones automáticas de Fibonacci al infinito derecho de la pantalla.
- **Micro-Sincronización de Indicadores**: EMAs (20, 50, 200) superpuestas en el precio y Chart RSI inferior con *timeScale* reaccionando dinámicamente al Scroll del usuario.
- **Control Activo y Dinámico de Riesgos**: Panel lateral asíncrono que manda mutaciones de variables (Ej: `Take Profit`, `Stop Loss`, `Puntos Bonus`, `Martingala Distancia`) de regreso al backend sin desconectar el motor.
- **Radiografía de Muros y SMC**: Herramienta visual en panel lateral dedicada a espiar de cerca las confluencias (1h, 4h, 1d) de Soportes/Resistencias algorítmicas vivas, permitiendo encenderlas superpuestas sobre el lienzo del PnL.
- **Audit Trails**: Historiales limitados y persistentes sobre *Trades*, marcadores de compraventa en velas históricas y *Señales* descartadas/aceptadas por scoring con su justificación algorítmica.

### 2. 🗄️ Dashboard de Analítica Cuantitativa e Inteligencia Artificial
- Visualización de grandes bloques de datos y cronjobs guardados en **Supabase**.
- Tarjetas de Soportes y Resistencias detallando su *confluencia* multi-temperatura en formato de píldoras.
- Registro visual de tarjetas de análisis de sentimiento para retrospectivas, indicando el veredicto explícito de IA, los pesos numéricos del análisis técnico y extractos de RSS (Noticias de CryptoPanic).

---

## 🚀 Tecnologías Utilizadas
- **Vue 3** (Composition API explícito `<script setup>`).
- **Tailwind CSS** (Clases utilitarias sobre un fondo oscuro e institucional estilo terminal bloomberg `#0f1729`).
- **Lightweight Charts** (TradingView canvas).
- **Vite** para Hot Module Replacement en tiempo de ejecución ultra liviano.
- Local Storage State Persistence para configuraciones del Trader.

---

## 🔧 Requisitos e Instalación

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configuración de Red
El servidor WebSocket por defecto espera conexiones al localhost del back Python. Ajusta en `/src/components/LiveTrading.vue` si tus puertos o IPs cambian:
`ws://localhost:8877/ws/live-feed`

### 3. Servidor en Desarrollo
```bash
npm run dev
```

### 4. Compilar para Producción
La compilación optimiza el payload a un puñado de kilobytes.
```bash
npm run build
npm run preview
```

---

## 📁 Estructura General
```
quant-trading-ui/
├── src/
│   ├── components/
│   │   ├── LiveTrading.vue        # Terminal gráfica (Websockets + Lightweight Charts)
│   │   ├── CryptoDashboard.vue    # Dashboard estático / histórico Supabase 
│   │   ├── Analytics.vue          # Gráficos complementarios de cuentas de resultados
│   │   ├── Settings.vue           # Componente futuro para llaves API
│   │   ├── ...
│   ├── App.vue                    # Sidebar oscuro institucional y router root
│   ├── main.js                    # Entry point y Tailwind layer import
│   └── index.css                  # Directivas Tailwind
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```
