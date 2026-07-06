import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function CVForm({ onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [photoPreview, setPhotoPreview] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const { register, handleSubmit, control, reset, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      bio: '',
      github_url: '',
      linkedin_url: '',
      skills: [],
      experience: [],
      education: [],
      projects: []
    }
  });

  // Dynamic Array Handlers for Experience, Education, and Projects
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: 'projects' });
  
  const skillsList = watch('skills') || [];

  // Fetch CV data on mount
  useEffect(() => {
    const fetchCV = async () => {
      try {
        const res = await api.get('/cv/me');
        if (res.data) {
          reset({
            name: res.data.name || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            bio: res.data.bio || '',
            github_url: res.data.github_url || '',
            linkedin_url: res.data.linkedin_url || '',
            skills: Array.isArray(res.data.skills) ? res.data.skills : [],
            experience: Array.isArray(res.data.experience) ? res.data.experience : [],
            education: Array.isArray(res.data.education) ? res.data.education : [],
            projects: Array.isArray(res.data.projects) ? res.data.projects : []
          });
          if (res.data.photo_url) {
            setPhotoPreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}/${res.data.photo_url}`);
          }
        }
      } catch (err) {
        // Empty CV is fine on register, we will insert on first save
        console.log('No existing CV data found, starting with empty profile.');
      }
    };
    fetchCV();
  }, [reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = (e) => {
    e.preventDefault();
    const val = newSkill.trim();
    if (val && !skillsList.includes(val)) {
      setValue('skills', [...skillsList, val]);
      setNewSkill('');
    }
  };

  const removeSkill = (indexToRemove) => {
    setValue('skills', skillsList.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('address', data.address);
    formData.append('phone', data.phone);
    formData.append('bio', data.bio);
    formData.append('github_url', data.github_url);
    formData.append('linkedin_url', data.linkedin_url);
    formData.append('skills', JSON.stringify(data.skills));
    formData.append('experience', JSON.stringify(data.experience));
    formData.append('education', JSON.stringify(data.education));
    formData.append('projects', JSON.stringify(data.projects));

    if (data.photo) {
      formData.append('photo', data.photo);
    }

    try {
      const res = await api.put('/cv/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('CV saved successfully!');
      if (res.data.photoUrl) {
        setPhotoPreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}/${res.data.photoUrl}`);
      }
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error saving CV data.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '1. Profile Info' },
    { id: 'skills', label: '2. Skills' },
    { id: 'experience', label: '3. Experience' },
    { id: 'education', label: '4. Education' },
    { id: 'projects', label: '5. Projects' }
  ];

  return (
    <div className="glass-panel" style={{ width: '100%' }}>
      <h2 className="glow-text-purple" style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
        CV CREATOR CONSOLE
      </h2>
      
      {/* Navigation tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
        paddingBottom: '10px',
        justifyContent: 'center'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: '11px',
              borderRadius: '4px',
              border: '1px solid ' + (activeTab === tab.id ? 'var(--neon-purple)' : 'transparent'),
              background: activeTab === tab.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tab 1: Profile Info */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '2px solid var(--neon-purple)',
                boxShadow: '0 0 8px var(--neon-purple-glow)',
                overflow: 'hidden',
                background: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Photo</span>
                )}
              </div>
              <div>
                <label className="btn btn-secondary" style={{ fontSize: '10px', padding: '8px 16px' }}>
                  Upload Image
                  <input type="file" onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  JPG, PNG, WEBP allowed. Max 2MB.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name *</label>
              <input 
                {...register('name', { required: true })} 
                required
                placeholder="e.g. Vijay Pal"
                style={{
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number *</label>
                <input 
                  {...register('phone', { required: true })} 
                  required
                  placeholder="e.g. +91 99999 99999"
                  style={{
                    padding: '12px',
                    background: 'rgba(5, 5, 16, 0.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Location / Address *</label>
                <input 
                  {...register('address', { required: true })} 
                  required
                  placeholder="e.g. Delhi, India"
                  style={{
                    padding: '12px',
                    background: 'rgba(5, 5, 16, 0.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bio / Professional Summary *</label>
              <textarea 
                {...register('bio', { required: true })} 
                required
                rows="4"
                placeholder="Write a brief professional summary..."
                style={{
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GitHub URL</label>
                <input 
                  {...register('github_url')} 
                  placeholder="https://github.com/yourusername"
                  style={{
                    padding: '12px',
                    background: 'rgba(5, 5, 16, 0.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>LinkedIn URL</label>
                <input 
                  {...register('linkedin_url')} 
                  placeholder="https://linkedin.com/in/yourusername"
                  style={{
                    padding: '12px',
                    background: 'rgba(5, 5, 16, 0.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Skills */}
        {activeTab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. React.js, SQLite, Node.js"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(5, 5, 16, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <button onClick={addSkill} className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '11px' }}>
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '60px', padding: '10px', background: '#0a0a2250', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
              {skillsList.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No skills added yet. Add some skills to show on your CV.</span>
              ) : (
                skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: 'var(--neon-blue)',
                      fontFamily: "'Orbitron', sans-serif"
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(236, 72, 153, 0.8)',
                        marginLeft: '8px',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Experience */}
        {activeTab === 'experience' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={() => appendExp({ company: '', role: '', duration: '', description: '' })}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '8px 16px', alignSelf: 'flex-end' }}
            >
              + Add Experience Record
            </button>

            {expFields.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px' }}>
                No work experience added yet.
              </p>
            ) : (
              expFields.map((field, idx) => (
                <div 
                  key={field.id} 
                  style={{
                    padding: '16px',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(10, 10, 34, 0.3)',
                    position: 'relative'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => removeExp(idx)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'transparent',
                      color: 'var(--neon-pink)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      border: '1px solid var(--neon-pink)',
                      borderRadius: '4px'
                    }}
                  >
                    Delete
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Company *</label>
                      <input 
                        {...register(`experience.${idx}.company`, { required: true })}
                        required
                        placeholder="e.g. Google"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Role *</label>
                      <input 
                        {...register(`experience.${idx}.role`, { required: true })}
                        required
                        placeholder="e.g. Software Engineer"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Duration *</label>
                      <input 
                        {...register(`experience.${idx}.duration`, { required: true })}
                        required
                        placeholder="e.g. June 2024 - Present"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Job Description *</label>
                      <textarea 
                        {...register(`experience.${idx}.description`, { required: true })}
                        required
                        rows="3"
                        placeholder="Describe your achievements and key responsibilities..."
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Education */}
        {activeTab === 'education' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={() => appendEdu({ institution: '', degree: '', year: '' })}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '8px 16px', alignSelf: 'flex-end' }}
            >
              + Add Education Record
            </button>

            {eduFields.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px' }}>
                No education added yet.
              </p>
            ) : (
              eduFields.map((field, idx) => (
                <div 
                  key={field.id} 
                  style={{
                    padding: '16px',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(10, 10, 34, 0.3)',
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => removeEdu(idx)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'transparent',
                      color: 'var(--neon-pink)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      border: '1px solid var(--neon-pink)',
                      borderRadius: '4px'
                    }}
                  >
                    Delete
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '15px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Institution / School *</label>
                    <input 
                      {...register(`education.${idx}.institution`, { required: true })}
                      required
                      placeholder="e.g. Stanford University"
                      style={{
                        padding: '10px',
                        background: 'rgba(5, 5, 16, 0.8)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Degree / Certification *</label>
                      <input 
                        {...register(`education.${idx}.degree`, { required: true })}
                        required
                        placeholder="e.g. B.Tech Computer Science"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Graduation Year *</label>
                      <input 
                        {...register(`education.${idx}.year`, { required: true })}
                        required
                        placeholder="e.g. 2025"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Projects */}
        {activeTab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={() => appendProj({ name: '', description: '', link: '' })}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '8px 16px', alignSelf: 'flex-end' }}
            >
              + Add Project Record
            </button>

            {projFields.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px' }}>
                No projects added yet.
              </p>
            ) : (
              projFields.map((field, idx) => (
                <div 
                  key={field.id} 
                  style={{
                    padding: '16px',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(10, 10, 34, 0.3)',
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => removeProj(idx)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'transparent',
                      color: 'var(--neon-pink)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      border: '1px solid var(--neon-pink)',
                      borderRadius: '4px'
                    }}
                  >
                    Delete
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project Name *</label>
                      <input 
                        {...register(`projects.${idx}.name`, { required: true })}
                        required
                        placeholder="e.g. Chat AI App"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project Link (optional)</label>
                      <input 
                        {...register(`projects.${idx}.link`)}
                        placeholder="https://github.com/project"
                        style={{
                          padding: '10px',
                          background: 'rgba(5, 5, 16, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Description *</label>
                    <textarea 
                      {...register(`projects.${idx}.description`, { required: true })}
                      required
                      rows="2"
                      placeholder="Brief project details, tech stack used, features..."
                      style={{
                        padding: '10px',
                        background: 'rgba(5, 5, 16, 0.8)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Form Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid rgba(124, 58, 237, 0.1)', paddingTop: '20px' }}>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px 30px',
              fontSize: '12px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving Data...' : 'Save & Compile CV'}
          </button>
        </div>
      </form>
    </div>
  );
}
