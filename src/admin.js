// ----------------------------------------------------------------------
// Enhanced ProjectAdmin Component with Contact Management
// ----------------------------------------------------------------------

const ProjectAdmin = ({ profileImage, onProfileImageChange }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const unreadCount = useContactNotifications();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.fetchAll();
      setProjects(data);
    } catch (err) {
      setError('Failed to fetch projects. Please try again.');
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSave = useCallback((savedProject) => {
    setProjects(prevProjects => {
      const existingIndex = prevProjects.findIndex(p => p._id === savedProject._id);
      if (existingIndex > -1) {
        const updated = [...prevProjects];
        updated[existingIndex] = savedProject;
        return updated;
      } else {
        return [savedProject, ...prevProjects];
      }
    });
    setEditingProject(null);
    setIsAdding(false);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      setError(null);
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p._id !== id));
      setProjectToDelete(null);
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error('Delete project error:', err);
    }
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage your portfolio projects and contact messages
              </p>
            </div>
            
            {/* Profile Image Management */}
            <div className="mt-4 md:mt-0">
              <ImageUpload
                label="Update Profile Image"
                currentImage={profileImage}
                onImageChange={onProfileImageChange}
                requiresAuth={false}
                variant="profile"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors relative ${
                activeTab === 'contacts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => setError(null)} 
              color="red" 
              size="sm" 
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'projects' ? (
          <div>
            {(isAdding || editingProject) ? (
              <ProjectForm 
                projectToEdit={editingProject} 
                onSave={handleSave} 
                onCancel={() => { 
                  setEditingProject(null); 
                  setIsAdding(false); 
                }} 
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Projects ({projects.length})
                  </h2>
                  <Button onClick={() => setIsAdding(true)}>
                    + Add New Project
                  </Button>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {projects.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first project.</p>
                      <Button onClick={() => setIsAdding(true)}>
                        Create Your First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {projects.map(project => (
                        <div key={project._id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                              {/* Project Thumbnail */}
                              {project.projectImage && (
                                <img 
                                  src={project.projectImage} 
                                  alt={project.title}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-indigo-700 truncate">
                                  {project.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {project.description}
                                </p>
                                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                  <span>ID: {project._id}</span>
                                  {project.createdAt && (
                                    <span>Created: {formatDate(project.createdAt)}</span>
                                  )}
                                  {project.projectImage && (
                                    <span className="text-green-600">📷 Has image</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                              <Button 
                                onClick={() => setEditingProject(project)} 
                                color="blue" 
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button 
                                onClick={() => setProjectToDelete(project._id)}
                                color="red" 
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ContactManager />
        )}

        <ConfirmModal 
          show={!!projectToDelete}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone and will permanently remove the project from your portfolio."
          confirmText="Delete Project"
          onConfirm={() => handleDelete(projectToDelete)}
          onCancel={() => setProjectToDelete(null)}
        />
      </div>
    </div>
  );
};
