const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf8');
content = content.replace(
  "import { Building2, Users, Ticket, Search, Plus, Trash2, Calendar, ShieldAlert, LogIn, PauseCircle, PlayCircle, Key, Edit, X, Activity, DollarSign, QrCode, Copy, Check, Sparkles, Download, RefreshCw, Image as ImageIcon, Tag, Printer, Zap } from 'lucide-react';",
  "import { Building2, Users, Ticket, Search, Plus, Trash2, Calendar, ShieldAlert, LogIn, PauseCircle, PlayCircle, Key, Edit, X, Activity, DollarSign, QrCode, Copy, Check, Sparkles, Download, RefreshCw, Image as ImageIcon, Tag, Printer, Zap, ChevronLeft, ChevronRight, CreditCard, ArrowUpRight, ArrowDownRight, List, Menu } from 'lucide-react';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';"
);
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'coupons'>('overview');",
  "const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'coupons' | 'transactions'>('overview');\n  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);\n  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');"
);
fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
