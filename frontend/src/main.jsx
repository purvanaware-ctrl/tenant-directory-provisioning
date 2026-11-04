
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Building2, Search, Plus, RefreshCw, ShieldCheck,
  Activity, CheckCircle, XCircle, PauseCircle,
  ClipboardList, Network, Eye, Settings
} from 'lucide-react';
import './style.css';

const API = 'http://127.0.0.1:8000/api';

function App() {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [q, setQ] = useState('');
  const [orgQ, setOrgQ] = useState('');
  const [tab, setTab] = useState('directory');
  const [show, setShow] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [provisionTenant, setProvisionTenant] = useState(null);
  const [provisionStatus, setProvisionStatus] = useState('Not Started');
  const [readinessNotes, setReadinessNotes] = useState('');
  const [form, setForm] = useState({
    name: '',
    tenant_code: '',
    tenant_type: 'Standard',
    region: 'India',
    admin_email: ''
  });
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const [tenantResponse, auditResponse, summaryResponse] =
        await Promise.all([
          fetch(API + '/tenants?search=' + encodeURIComponent(q)),
          fetch(API + '/audit'),
          fetch(API + '/provisioning/summary')
        ]);

      if (!tenantResponse.ok || !auditResponse.ok || !summaryResponse.ok) {
        throw new Error('Could not load dashboard data');
      }

      setRows(await tenantResponse.json());
      setLogs(await auditResponse.json());
      setSummary(await summaryResponse.json());
      setMsg('Connected to backend and MySQL');
    } catch (e) {
      setMsg('Backend not connected. Start the Python API first.');
    }
  }

  async function loadOrganizations() {
    try {
      const response = await fetch(
        API + '/organizations?search=' + encodeURIComponent(orgQ)
      );

      if (!response.ok) throw new Error('Organization request failed');

      const data = await response.json();
      setOrgs(data);
      setMsg('Organization directory loaded: ' + data.length + ' records');
    } catch (e) {
      setMsg('Could not load organizations: ' + e.message);
    }
  }

  useEffect(() => {
    load();
    loadOrganizations();
  }, []);

  async function create(e) {
    e.preventDefault();

    try {
      const response = await fetch(API + '/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not create tenant');

      setMsg(data.message || 'Request submitted');
      setShow(false);
      setForm({
        name: '',
        tenant_code: '',
        tenant_type: 'Standard',
        region: 'India',
        admin_email: ''
      });
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function status(id, s) {
    try {
      const response = await fetch(`${API}/tenants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: s,
          reason: 'Reviewed by Platform Admin'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Status update failed');

      setMsg(data.message);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  function openProvisioning(tenant) {
    setProvisionTenant(tenant);
    setProvisionStatus(tenant.provisioning_status || 'Not Started');
    setReadinessNotes(tenant.readiness_notes || '');
  }

  async function saveProvisioning(e) {
    e.preventDefault();
    if (!provisionTenant) return;

    try {
      const response = await fetch(
        `${API}/tenants/${provisionTenant.id}/provisioning`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provisioning_status: provisionStatus,
            readiness_notes: readinessNotes,
            reviewed_by: 'Platform Admin'
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Provisioning update failed');
      }

      setMsg(data.message || 'Provisioning updated');
      setProvisionTenant(null);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function updateOrgStatus(org, newStatus) {
    const reason = `Organization status changed to ${newStatus} by Platform Admin.`;

    try {
      const response = await fetch(
        `${API}/organizations/${org.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            reason,
            reviewed_by: 'Platform Admin'
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Organization update failed');
      }

      setMsg(data.message || 'Organization updated');
      setSelectedOrg(null);
      await loadOrganizations();
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  const count = s => rows.filter(x => x.status === s).length;

  const provisioningCount = s =>
    summary.find(x => x.provisioning_status === s)?.total || 0;

  const orgDetails = org => {
    const d = org.details || {};
    return {
      legalName: d.legalName || org.name,
      sector: d.educationSector || '—',
      region: d.stateOrRegion || '—',
      level: d.hierarchyLevel ?? '—',
      parent: d.parentOrganizationId || 'Root organization',
      scope: d.dataScope || '—',
      policy: d.policyInheritanceMode || '—',
      reporting: d.reportingStatus || '—',
      delegated: d.delegatedAdminEnabled ? 'Enabled' : 'Disabled',
      sources: Array.isArray(d.sourceSystemScope)
        ? d.sourceSystemScope.join(', ')
        : '—'
    };
  };

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <Building2 /> <b>INTELLIX</b>
        </div>

        <small>PLATFORM ADMIN</small>

        <button
          className={tab === 'directory' ? 'nav active' : 'nav'}
          onClick={() => setTab('directory')}
        >
          <Building2 /> Tenant Directory
        </button>

        <button
          className={tab === 'organizations' ? 'nav active' : 'nav'}
          onClick={() => {
            setTab('organizations');
            loadOrganizations();
          }}
        >
          <Network /> Organization Directory
        </button>

        <button
          className={tab === 'audit' ? 'nav active' : 'nav'}
          onClick={() => setTab('audit')}
        >
          <ClipboardList /> Governance & Audit
        </button>

        <div className="sidefoot">
          Tenant Provisioning<br />
          Assignment 131
        </div>
      </aside>

      <main>
        <header>
          <div>
            <small>ADMINISTRATION / PLATFORM GOVERNANCE</small>
            <h1>Tenant Provisioning</h1>
            <p>Manage tenant onboarding, organization boundaries and lifecycle governance.</p>
          </div>

          {tab === 'directory' && (
            <button className="primary" onClick={() => setShow(true)}>
              <Plus size={17} /> New Tenant
            </button>
          )}
        </header>

        <div className="notice">{msg || 'Tenant management workspace'}</div>

        {tab === 'directory' && (
          <>
            <section className="stats">
              <div><span>Total tenants</span><strong>{rows.length}</strong></div>
              <div><span>Pending review</span><strong>{count('Pending')}</strong></div>
              <div><span>Approved</span><strong>{count('Approved')}</strong></div>
              <div><span>Active</span><strong>{count('Active')}</strong></div>
            </section>

            <section className="panel">
              <div className="panelhead">
                <div>
                  <h2>Tenant Directory</h2>
                  <p>Review tenants and manage their provisioning readiness.</p>
                </div>
                <button className="secondary" onClick={load}>
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>

              <div className="stats">
                <div>
                  <span>Provisioning in progress</span>
                  <strong>{provisioningCount('In Progress')}</strong>
                </div>
                <div>
                  <span>Ready</span>
                  <strong>{provisioningCount('Ready')}</strong>
                </div>
                <div>
                  <span>Blocked</span>
                  <strong>{provisioningCount('Blocked')}</strong>
                </div>
                <div>
                  <span>Not started</span>
                  <strong>{provisioningCount('Not Started')}</strong>
                </div>
              </div>

              <div className="search">
                <Search size={17} />
                <input
                  placeholder="Search tenant name or code..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && load()}
                />
                <button onClick={load}>Search</button>
              </div>

              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Provisioning</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(t => (
                      <tr key={t.id}>
                        <td>
                          <b>{t.name}</b>
                          <small>Tenant ID: {t.id}</small>
                        </td>
                        <td>{t.tenant_code || '—'}</td>
                        <td>{t.tenant_type || 'Standard'}</td>
                        <td>{t.region || '—'}</td>
                        <td>
                          <span className={'pill ' + String(t.status).toLowerCase()}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <span className="pill">
                            {t.provisioning_status || 'Not Started'}
                          </span>
                          <button
                            className="secondary"
                            onClick={() => openProvisioning(t)}
                            title="Manage provisioning"
                          >
                            <Settings size={14} /> Manage
                          </button>
                        </td>
                        <td className="actions">
                          {t.status === 'Pending' && (
                            <>
                              <button title="Approve" onClick={() => status(t.id, 'Approved')}>
                                <CheckCircle />
                              </button>
                              <button title="Reject" onClick={() => status(t.id, 'Rejected')}>
                                <XCircle />
                              </button>
                              <button title="Return" onClick={() => status(t.id, 'Returned')}>
                                ↩
                              </button>
                            </>
                          )}
                          {t.status === 'Approved' && (
                            <button title="Activate" onClick={() => status(t.id, 'Active')}>
                              <ShieldCheck />
                            </button>
                          )}
                          {t.status === 'Active' && (
                            <button title="Suspend" onClick={() => status(t.id, 'Suspended')}>
                              <PauseCircle />
                            </button>
                          )}
                          {t.status === 'Suspended' && (
                            <button onClick={() => status(t.id, 'Active')}>
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan="7" className="empty">No tenants found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === 'organizations' && (
          <section className="panel">
            <div className="panelhead">
              <div>
                <h2>Organization Directory</h2>
                <p>Review organization hierarchy, data boundaries and lifecycle settings.</p>
              </div>
              <button className="secondary" onClick={loadOrganizations}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            <div className="stats">
              <div><span>Total organizations</span><strong>{orgs.length}</strong></div>
              <div><span>Active</span><strong>{orgs.filter(o => o.status === 'Active').length}</strong></div>
              <div><span>Root organizations</span><strong>{orgs.filter(o => o.details?.hierarchyLevel === 0).length}</strong></div>
              <div><span>Other organizations</span><strong>{orgs.filter(o => o.details?.hierarchyLevel > 0).length}</strong></div>
            </div>

            <div className="search">
              <Search size={17} />
              <input
                placeholder="Search organization, type or tenant..."
                value={orgQ}
                onChange={e => setOrgQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadOrganizations()}
              />
              <button onClick={loadOrganizations}>Search</button>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Tenant ID</th>
                    <th>Type</th>
                    <th>Sector / Region</th>
                    <th>Level</th>
                    <th>Lifecycle</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map(org => {
                    const d = orgDetails(org);
                    return (
                      <tr key={org.id}>
                        <td>
                          <b>{org.name}</b>
                          <small>{org.source_id}</small>
                        </td>
                        <td>{org.tenant_source_id || '—'}</td>
                        <td>{org.org_type || '—'}</td>
                        <td>{d.sector} / {d.region}</td>
                        <td>{d.level}</td>
                        <td>
                          <span className={'pill ' + String(org.status).toLowerCase()}>
                            {org.status}
                          </span>
                        </td>
                        <td>
                          <button className="secondary" onClick={() => setSelectedOrg(org)}>
                            <Eye size={15} /> View / Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!orgs.length && (
                    <tr>
                      <td colSpan="7" className="empty">No organizations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'audit' && (
          <section className="panel">
            <div className="panelhead">
              <div>
                <h2>Governance & Audit History</h2>
                <p>Recorded tenant actions and lifecycle changes.</p>
              </div>
              <button className="secondary" onClick={load}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {logs.map(l => (
              <div className="log" key={l.id}>
                <Activity />
                <div>
                  <b>{l.action}</b>
                  <p>{l.tenant_name || 'Tenant'} · {l.details}</p>
                  <small>{new Date(l.created_at).toLocaleString()}</small>
                </div>
              </div>
            ))}
            {!logs.length && <p className="empty">No audit events yet.</p>}
          </section>
        )}

        {show && (
          <div className="overlay">
            <form className="modal" onSubmit={create}>
              <h2>Create Tenant Request</h2>
              <p>Enter organization details for platform review.</p>

              {[
                ['name', 'Tenant name'],
                ['tenant_code', 'Tenant code'],
                ['admin_email', 'Administrator email'],
                ['region', 'Region']
              ].map(([k, label]) => (
                <label key={k}>
                  {label}
                  <input
                    required={k === 'name'}
                    value={form[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                  />
                </label>
              ))}

              <label>
                Tenant type
                <select
                  value={form.tenant_type}
                  onChange={e => setForm({ ...form, tenant_type: e.target.value })}
                >
                  <option>Standard</option>
                  <option>Enterprise</option>
                  <option>Government</option>
                  <option>Education</option>
                </select>
              </label>

              <div className="modalactions">
                <button type="button" className="secondary" onClick={() => setShow(false)}>
                  Cancel
                </button>
                <button className="primary">Submit request</button>
              </div>
            </form>
          </div>
        )}

        {provisionTenant && (
          <div className="overlay" onClick={() => setProvisionTenant(null)}>
            <form className="modal" onSubmit={saveProvisioning} onClick={e => e.stopPropagation()}>
              <h2>Provisioning Readiness</h2>
              <p><b>{provisionTenant.name}</b> · Tenant ID: {provisionTenant.id}</p>

              <label>
                Provisioning status
                <select
                  value={provisionStatus}
                  onChange={e => setProvisionStatus(e.target.value)}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Ready</option>
                  <option>Blocked</option>
                  <option>Completed</option>
                </select>
              </label>

              <label>
                Readiness notes
                <textarea
                  rows="4"
                  value={readinessNotes}
                  onChange={e => setReadinessNotes(e.target.value)}
                  placeholder="Record setup checks, blockers or readiness evidence..."
                />
              </label>

              <p><small>Reviewed by: Platform Admin</small></p>

              <div className="modalactions">
                <button type="button" className="secondary" onClick={() => setProvisionTenant(null)}>
                  Cancel
                </button>
                <button className="primary">Save provisioning</button>
              </div>
            </form>
          </div>
        )}

        {selectedOrg && (
          <div className="overlay" onClick={() => setSelectedOrg(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>{selectedOrg.name}</h2>
              <p>Organization boundary and governance details</p>

              {Object.entries({
                'Organization ID': selectedOrg.source_id,
                'Tenant ID': selectedOrg.tenant_source_id,
                'Legal name': orgDetails(selectedOrg).legalName,
                'Parent organization': orgDetails(selectedOrg).parent,
                'Hierarchy level': orgDetails(selectedOrg).level,
                'Education sector': orgDetails(selectedOrg).sector,
                'Region': orgDetails(selectedOrg).region,
                'Data scope': orgDetails(selectedOrg).scope,
                'Policy inheritance': orgDetails(selectedOrg).policy,
                'Reporting status': orgDetails(selectedOrg).reporting,
                'Delegated admin': orgDetails(selectedOrg).delegated,
                'Source systems': orgDetails(selectedOrg).sources
              }).map(([label, value]) => (
                <p key={label}><b>{label}:</b> {String(value)}</p>
              ))}

              <label>
                Lifecycle actions
                <select
                  value={selectedOrg.status}
                  onChange={e => updateOrgStatus(selectedOrg, e.target.value)}
                >
                  <option>Active</option>
                  <option>Suspended</option>
                  <option>Archived</option>
                  <option>Draft</option>
                  <option>Validation Pending</option>
                  <option>Decommissioned</option>
                </select>
              </label>

              <div className="modalactions">
                <button className="primary" onClick={() => setSelectedOrg(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
