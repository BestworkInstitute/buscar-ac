import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import '../public/styles.css';

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
                logMessage('🚀 Proceso completado. Archivo Excel descargado.', 'success'); // Mensaje final
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
        <div>
            <h1>Revisar correos en Active Campaign</h1>
            <form>
                <label htmlFor="csvFile">Carga tu archivo CSV:</label>
                <input
                    type="file"
                    id="csvFile"
                    accept=".csv"
                    onChange={(e) => processCSV(e.target.files[0])}
                    disabled={processing}
                />
            </form>
            <div id="console">
                {logs.map((log, index) => (
                    <div key={index} className={`log ${log.type}`}>
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
