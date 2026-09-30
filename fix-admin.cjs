const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const corruptedStart = `  const [editingId, setEditingId] = useState<strin  const handleAddStaff = async (e: React.FormEvent) => {`;
const corruptedEnd = `  };nc () => {};`;

const targetToReplace = code.substring(code.indexOf(corruptedStart), code.indexOf(corruptedEnd) + corruptedEnd.length);

const correctReplacement = `  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [qrStaffId, setQrStaffId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [useOverrides, setUseOverrides] = useState(false);
  const [shiftOverrides, setShiftOverrides] = useState<any>({});
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [formData, setFormData] = useState({
    name: "",
    nameKh: "",
    passcode: "",
    monthlySalary: 360,
    position: "",
    branch: "",
    shiftStart: "16:30",
    shift2Start: "",
    shift2End: "",
    shiftEnd: "00:00",
    breakHours: 0,
    bonus: 0,
  });

  useEffect(() => {
    if (!user?.companyId) return;
    const unsub = onSnapshot(
      query(collection(db, "staff"), where("companyId", "==", user.companyId)),
      (sn) => {
        setStaffList(sn.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff).filter(s => s.role !== "admin").sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true })));
      }
    );
    return () => unsub();
  }, [user?.companyId]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchStaff = async () => {};`;

code = code.replace(targetToReplace, correctReplacement);
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed');
