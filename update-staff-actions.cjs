const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetStr = `  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      companyId: user?.companyId || "",
      shiftOverrides: useOverrides ? shiftOverrides : null,
      hourlyRate: formData.monthlySalary / 240,
    };

    if (editingId) {
      await updateDoc(doc(db, "staff", editingId), dataToSave);
    } else {
      await addDoc(collection(db, "staff"), {
        ...dataToSave,
        role: "staff",
        createdAt: new Date().toISOString(),
      });
      const empName = formData.nameKh ? \`\${formData.nameKh} (\${formData.name})\` : formData.name;
      await sendTelegramNotification(
        \`👤 <b>បន្ថែមបុគ្គលិកថ្មី (New Employee Added)</b>\\n<b>ឈ្មោះ:</b> \${empName}\\n<b>តួនាទី:</b> \${formData.position || 'N/A'}\\n<b>សាខា:</b> \${formData.branch || 'N/A'}\\n<b>ប្រាក់ខែ/ម៉ោង:</b> $\${formData.monthlySalary ? \`\${formData.monthlySalary}/ខែ\` : \`\${(formData.monthlySalary / 240).toFixed(2)}/ម៉ោង\`}\`,
        true
      );
    }
    setShowModal(false);
    setEditingId(null);
    fetchStaff();
  };

  const deleteStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await deleteDoc(doc(db, "staff", staffToDelete));
      fetchStaff();
      setStaffToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };`;

const replacement = `  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      companyId: user?.companyId || "",
      shiftOverrides: useOverrides ? shiftOverrides : null,
      hourlyRate: formData.monthlySalary / 240,
    };

    const empName = formData.nameKh ? \`\${formData.nameKh} (\${formData.name})\` : formData.name;
    const shiftStr = useOverrides ? 
      \`Morning: \${shiftOverrides.morning?.start || '-'} to \${shiftOverrides.morning?.end || '-'}, Afternoon: \${shiftOverrides.afternoon?.start || '-'} to \${shiftOverrides.afternoon?.end || '-'}\` :
      "Master Shift";

    if (editingId) {
      await updateDoc(doc(db, "staff", editingId), dataToSave);
      await sendTelegramNotification(
        \`✏️ <b>កែប្រែព័ត៌មានបុគ្គលិក (Employee Edited)</b>\\n<b>ឈ្មោះ:</b> \${empName}\\n<b>តួនាទី:</b> \${formData.position || 'N/A'}\\n<b>សាខា:</b> \${formData.branch || 'N/A'}\\n<b>ម៉ោងធ្វើការ (Shift):</b> \${shiftStr}\\n<b>ប្រាក់ខែ:</b> $\${formData.monthlySalary}/ខែ\`,
        true
      );
    } else {
      await addDoc(collection(db, "staff"), {
        ...dataToSave,
        role: "staff",
        createdAt: new Date().toISOString(),
      });
      await sendTelegramNotification(
        \`👤 <b>បន្ថែមបុគ្គលិកថ្មី (New Employee Added)</b>\\n<b>ឈ្មោះ:</b> \${empName}\\n<b>តួនាទី:</b> \${formData.position || 'N/A'}\\n<b>សាខា:</b> \${formData.branch || 'N/A'}\\n<b>ម៉ោងធ្វើការ (Shift):</b> \${shiftStr}\\n<b>ប្រាក់ខែ:</b> $\${formData.monthlySalary}/ខែ\`,
        true
      );
    }

    setShowModal(false);
    setEditingId(null);
    fetchStaff();
  };

  const deleteStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const deletedStaff = staffList.find(s => s.id === staffToDelete);
      await deleteDoc(doc(db, "staff", staffToDelete));
      
      if (deletedStaff) {
        const empName = deletedStaff.nameKh ? \`\${deletedStaff.nameKh} (\${deletedStaff.name})\` : deletedStaff.name;
        await sendTelegramNotification(
          \`🗑 <b>លុบบុគ្គលិក (Employee Deleted)</b>\\n<b>ឈ្មោះ:</b> \${empName}\\n<b>តួនាទី:</b> \${deletedStaff.position || 'N/A'}\\n<b>សាខា:</b> \${deletedStaff.branch || 'N/A'}\`,
          true
        );
      }
      
      fetchStaff();
      setStaffToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };`;

if (!code.includes(targetStr)) {
  console.log('Target string not found');
} else {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log('Successfully updated staff actions');
}
