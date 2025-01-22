import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email } = req.body;

        try {
            const response = await axios.get(
                'https://sedsa.api-us1.com/api/3/contacts',
                {
                    headers: { 'Api-Token': 'd2830a151e2d5ae79ee56b3bf8035c9728d27a1c75fbd2fe89eff5f11c57f078c0f93ae1' }, // Reemplaza con tu token real
                    params: { email },
                }
            );

            if (response.data.contacts && response.data.contacts.length > 0) {
                res.status(200).json({ email, status: 'found' });
            } else {
                res.status(200).json({ email, status: 'not_found' });
            }
        } catch (error) {
            console.error('Error al consultar la API externa:', error.message);
            res.status(500).json({ email, status: 'error', message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
