/**
 * Vercel Serverless Function — /api/save-lead
 *
 * Accepts a POST request with lead data from the calculator form,
 * validates required fields, then forwards the payload to the
 * Google Apps Script Web App which writes a new row in Google Sheets.
 *
 * Environment variable required:
 *   GOOGLE_SCRIPT_URL — the deployed Apps Script Web App URL
 */

module.exports = async function handler(req, res) {
  /* Only allow POST */
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  /* Parse body — Vercel parses JSON automatically when Content-Type is application/json */
  var body = req.body || {};

  var name           = (body.name           || '').toString().trim();
  var phone          = (body.phone          || '').toString().trim();
  var comment        = (body.comment        || '').toString().trim();
  var objectType     = (body.objectType     || '').toString().trim();
  var area           = body.area;
  var repairType     = (body.repairType     || '').toString().trim();
  var designProject  = (body.designProject  || '').toString().trim();
  var materials      = (body.materials      || '').toString().trim();
  var urgency        = (body.urgency        || '').toString().trim();
  var pricePerMeter  = body.pricePerMeter  || 0;
  var estimatedTotal = body.estimatedTotal || 0;
  var source         = (body.source        || 'website_calculator').toString().trim();
  var createdAt      = (body.createdAt     || new Date().toISOString()).toString().trim();

  /* Validate required fields */
  if (!name || !phone || area === undefined || area === null || !estimatedTotal) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  /* Check environment variable */
  var scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    console.error('GOOGLE_SCRIPT_URL is not configured');
    return res.status(500).json({ success: false, message: 'GOOGLE_SCRIPT_URL is not configured' });
  }

  /* Build payload for Apps Script */
  var payload = {
    name:           name,
    phone:          phone,
    comment:        comment,
    objectType:     objectType,
    area:           area,
    repairType:     repairType,
    designProject:  designProject,
    materials:      materials,
    urgency:        urgency,
    pricePerMeter:  pricePerMeter,
    estimatedTotal: estimatedTotal,
    source:         source,
    createdAt:      createdAt
  };

  try {
    var response = await fetch(scriptUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('Apps Script responded with status', response.status);
      return res.status(502).json({ success: false, message: 'Failed to reach Google Sheets' });
    }

    var data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true, message: 'Lead saved' });
    } else {
      console.error('Apps Script error:', data);
      return res.status(500).json({ success: false, message: 'Google Sheets error' });
    }

  } catch (error) {
    console.error('save-lead error:', error.message || error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
