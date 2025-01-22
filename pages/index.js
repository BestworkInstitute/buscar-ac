import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function Home() {
    const [logs, setLogs] = useState([]);
    const [processing, setProcessing] = useState(false);

    const logMessage = (message, type = 'log') => {
        setLogs((prev) => [...prev, { message, type }]);
    };

    const processCSV = async (file) => {
        setLogs([]);
        setProcessing(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const emailsAndPhones = results.data.map((row) => ({
                    email: row['Correo electrónico'],
                    phone: row['Teléfono'],
                }));

                const resultsData = [];

                for (const { email, phone } of emailsAndPhones) {
                    try {
                        logMessage(`Procesando: ${email}`, 'processing');
                        const res = await fetch('/api/checkEmail', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                        });

                        const data = await res.json();
                        if (data.status === 'found') {
                            logMessage(`Encontrado: ${email}`, 'success');
                        } else if (data.status === 'not_found') {
                            logMessage(`No encontrado: ${email}`, 'error');
                        }

                        resultsData.push({ 
                            Email: email, 
                            Teléfono: phone, 
                            Estado: data.status 
                        });
                    } catch (error) {
                        logMessage(`Error: ${email} - ${error.message}`, 'error');
                        resultsData.push({ 
                            Email: email, 
                            Teléfono: phone, 
                            Estado: 'error' 
                        });
                    }
                }

                setProcessing(false);
                generateExcel(resultsData);
                logMessage('🚀 Proceso completado. Archivo Excel descargado.', 'success');
            },
        });
    };

    const generateExcel = (data) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        XLSX.writeFile(wb, `Resultados_${dateStr}.xlsx`);
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ fontSize: '2rem', color: '#4CAF50' }}>Procesador CSV y Verificador de Correos</h1>
            <form>
                <label htmlFor="csvFile">Carga tu archivo CSV:</label>
                <br />
                <input
                    type="file"
                    id="csvFile"
                    accept=".csv"
                    onChange={(e) => processCSV(e.target.files[0])}
                    disabled={processing}
                    style={{ padding: '10px', margin: '10px', fontSize: '16px' }}
                />
            </form>
            <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', maxHeight: '200px', overflowY: 'auto', textAlign: 'left' }}>
                {logs.map((log, index) => (
                    <div key={index} style={{ fontFamily: 'monospace', color: log.type === 'success' ? 'green' : log.type === 'error' ? 'red' : 'orange' }}>
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
