# Implementation Guide for Remaining Features

**Status**: 6/15 tasks completed
**Last Updated**: 2026-01-03

## ✅ Completed Tasks

1. **✅ Replaced Real API Keys** - Removed actual keys from `.env.example` files
2. **✅ Audited Supabase Service Role Key** - Verified secure client/server separation
3. **✅ Added Publishing Warnings** - Clear notices that Jamal publishing is non-functional
4. **✅ Fixed Environment Variable Inconsistencies** - Standardized on `SUPABASE_SERVICE_ROLE_KEY`
5. **✅ Removed Debug Telemetry** - Cleaned up `localhost:7243` calls
6. **✅ Added Rate Limiting** - Infrastructure created and applied to critical routes

---

## 📋 Remaining Tasks (9/15)

### Quick Wins (Re-enable Existing Features)

#### Task 7: Re-enable File Upload UI ⏱️ ~30 min
**Status**: Hidden in Phase 1
**Location**: `frontend/src/app/studio/page.tsx:599-615`

**Implementation Steps**:
1. Open `frontend/src/app/studio/page.tsx`
2. Find lines 599-615 (the commented out file attachment button)
3. Uncomment the file upload UI:
   ```tsx
   {/* Uncomment this block */}
   <button
     type="button"
     onClick={() => fileInputRef.current?.click()}
     className="..."
   >
     <Paperclip className="h-4 w-4" />
   </button>
   ```
4. Test file upload functionality
5. Verify files appear in the UI after upload

**Files to Modify**:
- `frontend/src/app/studio/page.tsx` (lines 599-615)

---

#### Task 8: Re-enable Workflow Suggestions UI ⏱️ ~20 min
**Status**: Hidden in Phase 1
**Location**: `frontend/src/app/studio/page.tsx:547-555`

**Implementation Steps**:
1. Open `frontend/src/app/studio/page.tsx`
2. Find lines 547-555 (commented out workflow suggestions)
3. Uncomment the workflow suggestions display
4. Test that suggestions appear after file upload
5. Verify workflow creation works

**Files to Modify**:
- `frontend/src/app/studio/page.tsx` (lines 547-555)

---

#### Task 9: Replace Mock Analytics Data ⏱️ ~2 hours
**Status**: Returns fake data
**Location**: `frontend/src/app/api/analytics/route.ts`

**Current Implementation**:
```typescript
// Returns hardcoded mock data
const mockAnalytics = {
  totalProjects: 12,
  totalAssets: 45,
  // ... etc
};
```

**Implementation Steps**:
1. Read `frontend/src/app/api/analytics/route.ts`
2. Replace mock data with actual database queries:
   ```typescript
   const { data: projects } = await supabase
     .from('projects')
     .select('*')
     .eq('user_id', userId);

   const { data: assets } = await supabase
     .from('assets')
     .select('*')
     .eq('user_id', userId);
   ```
3. Calculate real metrics:
   - Count projects, assets, workflows
   - Aggregate file sizes
   - Count by file type
   - Calculate costs from generation logs
4. Add error handling
5. Test with real data

**Database Tables Needed**:
- `projects`
- `assets`
- `files`
- `workflows`
- `image_generation_logs` (already exists)

**Files to Modify**:
- `frontend/src/app/api/analytics/route.ts`

---

### Major Feature Additions (New UI Components)

#### Task 10: NanoBanana UI Controls ⏱️ ~8 hours
**Status**: Backend exists, no UI
**Backend**: `frontend/src/backend/nanobanana/nanobananaClient.ts`
**Documentation**: `docs/NANOBANANA_PRO_INTEGRATION.md`

**Features to Expose**:
1. Character Sheet Generation
2. Storyboard Generation (9-12 frames)
3. Image Upscaling (4K/8K)
4. Drift Fixing

**Implementation Plan**:

1. **Create UI Component** (`frontend/src/components/NanoBananaControls.tsx`):
   ```tsx
   interface NanoBananaControlsProps {
     projectId: string;
     onGenerate: (result: any) => void;
   }

   export function NanoBananaControls({ projectId, onGenerate }: NanoBananaControlsProps) {
     const [mode, setMode] = useState<'character' | 'storyboard' | 'upscale' | 'drift'>('character');

     // Character sheet controls
     const CharacterSheetPanel = () => (
       <div>
         <input placeholder="Character description" />
         <select>{/* Styles */}</select>
         <button onClick={handleGenerateCharacter}>Generate Character</button>
       </div>
     );

     // Similar panels for storyboard, upscale, drift

     return (
       <div className="nanobanana-controls">
         <TabGroup selected={mode} onChange={setMode}>
           <Tab>Character</Tab>
           <Tab>Storyboard</Tab>
           <Tab>Upscale</Tab>
           <Tab>Drift Fix</Tab>
         </TabGroup>

         {mode === 'character' && <CharacterSheetPanel />}
         {/* ... other panels */}
       </div>
     );
   }
   ```

2. **Add to Studio** (`frontend/src/app/studio/page.tsx`):
   - Add tab or expandable section
   - Integrate NanoBananaControls component
   - Handle results and display

3. **Create API Route** (already exists at `frontend/src/app/api/tools/nanobanana/route.ts`):
   - Verify all operations are exposed
   - Add rate limiting (already added)
   - Test each operation

4. **Test**:
   - Character sheet generation
   - Storyboard with 9-12 frames
   - Upscaling to 4K/8K
   - Drift fixing

**Files to Create**:
- `frontend/src/components/NanoBananaControls.tsx`
- `frontend/src/components/CharacterSheetViewer.tsx` (display results)
- `frontend/src/components/StoryboardViewer.tsx`

**Files to Modify**:
- `frontend/src/app/studio/page.tsx` (integrate component)

---

#### Task 11: Kling AI Video Generation UI ⏱️ ~6 hours
**Status**: Backend exists, no UI
**Backend**: `frontend/src/backend/videoProviders/klingAdapter.ts`
**Documentation**: `docs/KLING_AI_INTEGRATION.md`

**Features to Expose**:
1. Model Selection (2.5-turbo, 1.0, 2.6)
2. Text-to-Video
3. Image-to-Video
4. Post-Production Editing (lighting, weather, camera)

**Implementation Plan**:

1. **Create UI Component** (`frontend/src/components/KlingVideoControls.tsx`):
   ```tsx
   export function KlingVideoControls({ onGenerate }) {
     const [model, setModel] = useState<'2.5-turbo' | '1.0' | '2.6'>('2.5-turbo');
     const [mode, setMode] = useState<'text' | 'image'>('text');
     const [prompt, setPrompt] = useState('');
     const [imageUrl, setImageUrl] = useState('');
     const [postProduction, setPostProduction] = useState({
       lighting: 'natural',
       weather: 'clear',
       cameraAngle: 'eye-level',
     });

     return (
       <div className="kling-controls">
         <div>
           <label>Model</label>
           <select value={model} onChange={e => setModel(e.target.value)}>
             <option value="2.5-turbo">Kling 2.5 Turbo (Fast)</option>
             <option value="1.0">Kling 1.0 (Quality)</option>
             <option value="2.6">Kling 2.6 (Latest)</option>
           </select>
         </div>

         <div>
           <label>Mode</label>
           <ToggleGroup value={mode} onChange={setMode}>
             <Toggle value="text">Text to Video</Toggle>
             <Toggle value="image">Image to Video</Toggle>
           </ToggleGroup>
         </div>

         {mode === 'text' ? (
           <textarea
             placeholder="Describe your video..."
             value={prompt}
             onChange={e => setPrompt(e.target.value)}
           />
         ) : (
           <ImageUpload onUpload={setImageUrl} />
         )}

         <PostProductionControls
           value={postProduction}
           onChange={setPostProduction}
         />

         <button onClick={handleGenerate}>Generate Video</button>
       </div>
     );
   }
   ```

2. **Post-Production Controls** (`frontend/src/components/PostProductionControls.tsx`):
   ```tsx
   export function PostProductionControls({ value, onChange }) {
     return (
       <div className="post-production">
         <div>
           <label>Lighting</label>
           <select
             value={value.lighting}
             onChange={e => onChange({ ...value, lighting: e.target.value })}
           >
             <option value="natural">Natural</option>
             <option value="studio">Studio</option>
             <option value="dramatic">Dramatic</option>
             <option value="soft">Soft</option>
           </select>
         </div>

         <div>
           <label>Weather</label>
           <select
             value={value.weather}
             onChange={e => onChange({ ...value, weather: e.target.value })}
           >
             <option value="clear">Clear</option>
             <option value="rainy">Rainy</option>
             <option value="foggy">Foggy</option>
             <option value="snowy">Snowy</option>
           </select>
         </div>

         <div>
           <label>Camera Angle</label>
           <select
             value={value.cameraAngle}
             onChange={e => onChange({ ...value, cameraAngle: e.target.value })}
           >
             <option value="eye-level">Eye Level</option>
             <option value="low">Low Angle</option>
             <option value="high">High Angle</option>
             <option value="aerial">Aerial</option>
           </select>
         </div>
       </div>
     );
   }
   ```

3. **Integrate into Studio**
4. **Add Progress Tracking** (video generation takes time)
5. **Test all models and modes**

**Files to Create**:
- `frontend/src/components/KlingVideoControls.tsx`
- `frontend/src/components/PostProductionControls.tsx`
- `frontend/src/components/VideoGenerationProgress.tsx`

---

#### Task 12: Suno Music Generation UI ⏱️ ~4 hours
**Status**: Backend exists, no UI
**Backend**: `agentkit/integrations/sunoClient.ts`

**Features to Expose**:
1. Lyrics to Music
2. Style/Genre Selection
3. Duration Control
4. Mood Selection

**Implementation Plan**:

1. **Create UI Component** (`frontend/src/components/SunoMusicControls.tsx`):
   ```tsx
   export function SunoMusicControls({ onGenerate }) {
     const [lyrics, setLyrics] = useState('');
     const [style, setStyle] = useState('pop');
     const [duration, setDuration] = useState(60);
     const [mood, setMood] = useState('upbeat');

     return (
       <div className="suno-controls">
         <div>
           <label>Lyrics</label>
           <textarea
             placeholder="Enter your lyrics..."
             value={lyrics}
             onChange={e => setLyrics(e.target.value)}
             rows={10}
           />
         </div>

         <div>
           <label>Genre/Style</label>
           <select value={style} onChange={e => setStyle(e.target.value)}>
             <option value="pop">Pop</option>
             <option value="rock">Rock</option>
             <option value="hip-hop">Hip Hop</option>
             <option value="electronic">Electronic</option>
             <option value="jazz">Jazz</option>
             <option value="classical">Classical</option>
           </select>
         </div>

         <div>
           <label>Mood</label>
           <select value={mood} onChange={e => setMood(e.target.value)}>
             <option value="upbeat">Upbeat</option>
             <option value="melancholic">Melancholic</option>
             <option value="energetic">Energetic</option>
             <option value="calm">Calm</option>
             <option value="dramatic">Dramatic</option>
           </select>
         </div>

         <div>
           <label>Duration: {duration}s</label>
           <input
             type="range"
             min="30"
             max="180"
             value={duration}
             onChange={e => setDuration(Number(e.target.value))}
           />
         </div>

         <button onClick={() => handleGenerate({ lyrics, style, duration, mood })}>
           Generate Music
         </button>
       </div>
     );
   }
   ```

2. **API Route** (already exists at `frontend/src/app/api/tools/suno/route.ts`):
   - Verify it works
   - Add rate limiting
   - Test generation

3. **Music Player Component** (`frontend/src/components/MusicPlayer.tsx`):
   - Play generated music
   - Show waveform
   - Download option

**Files to Create**:
- `frontend/src/components/SunoMusicControls.tsx`
- `frontend/src/components/MusicPlayer.tsx`

---

#### Task 13: Provider Selection Interface ⏱️ ~6 hours
**Status**: Not implemented
**Backend**: Multiple provider adapters exist

**Providers to Expose**:
- **Image**: Runway, Stable Diffusion (SDXL), Replicate
- **Video**: Kling AI, Runway ML
- **Storage**: Supabase, QNAP, S3, Local

**Implementation Plan**:

1. **Create Settings Page** (`frontend/src/app/settings/page.tsx`):
   ```tsx
   export default function SettingsPage() {
     const [settings, setSettings] = useState({
       imageProvider: 'runway',
       videoProvider: 'kling',
       storageProvider: 'supabase',
     });

     return (
       <div className="settings-page">
         <h1>Provider Settings</h1>

         <section>
           <h2>Image Generation</h2>
           <ProviderSelector
             type="image"
             value={settings.imageProvider}
             onChange={provider => setSettings({ ...settings, imageProvider: provider })}
             options={[
               { value: 'runway', label: 'Runway ML', description: 'High quality, fast' },
               { value: 'sdxl', label: 'Stable Diffusion XL', description: 'Open source, cost-effective' },
               { value: 'replicate', label: 'Replicate', description: 'Various models available' },
             ]}
           />
         </section>

         <section>
           <h2>Video Generation</h2>
           <ProviderSelector
             type="video"
             value={settings.videoProvider}
             onChange={provider => setSettings({ ...settings, videoProvider: provider })}
             options={[
               { value: 'kling', label: 'Kling AI', description: 'Multiple models, post-production' },
               { value: 'runway', label: 'Runway ML', description: 'Industry standard' },
             ]}
           />
         </section>

         <section>
           <h2>Storage</h2>
           <ProviderSelector
             type="storage"
             value={settings.storageProvider}
             onChange={provider => setSettings({ ...settings, storageProvider: provider })}
             options={[
               { value: 'supabase', label: 'Supabase Storage', description: 'Cloud storage with CDN' },
               { value: 'qnap', label: 'QNAP NAS', description: 'Local network storage' },
               { value: 's3', label: 'Amazon S3', description: 'Enterprise cloud storage' },
               { value: 'local', label: 'Local Filesystem', description: 'Development only' },
             ]}
           />
         </section>

         <button onClick={saveSettings}>Save Settings</button>
       </div>
     );
   }
   ```

2. **Provider Selector Component** (`frontend/src/components/ProviderSelector.tsx`):
   ```tsx
   export function ProviderSelector({ type, value, onChange, options }) {
     return (
       <div className="provider-selector">
         {options.map(option => (
           <div
             key={option.value}
             className={`provider-option ${value === option.value ? 'selected' : ''}`}
             onClick={() => onChange(option.value)}
           >
             <div className="provider-label">{option.label}</div>
             <div className="provider-description">{option.description}</div>
             {value === option.value && <CheckIcon className="check-icon" />}
           </div>
         ))}
       </div>
     );
   }
   ```

3. **Save to User Preferences**:
   - Store in database: `user_preferences` table
   - Load on app startup
   - Use in provider routing logic

**Files to Create**:
- `frontend/src/app/settings/page.tsx`
- `frontend/src/components/ProviderSelector.tsx`
- `frontend/src/lib/userPreferences.ts` (load/save logic)

**Database Migration**:
```sql
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  image_provider TEXT DEFAULT 'runway',
  video_provider TEXT DEFAULT 'kling',
  storage_provider TEXT DEFAULT 'supabase',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### Task 14: Workflow Template Builder ⏱️ ~10 hours
**Status**: One template exists, no builder UI
**Current**: `frontend/src/lib/workflow/templates/nanobananaKlingWorkflow.ts`

**Implementation Plan**:

1. **Create Template Builder UI** (`frontend/src/app/workflows/templates/new/page.tsx`):
   ```tsx
   export default function TemplateBuilderPage() {
     const [template, setTemplate] = useState({
       name: '',
       description: '',
       tasks: [],
     });

     const [availableActions] = useState([
       { id: 'generate-story', label: 'Generate Story', agent: 'giorgio' },
       { id: 'generate-music', label: 'Generate Music', agent: 'suno' },
       { id: 'generate-character', label: 'Generate Character', agent: 'nanobanana' },
       { id: 'generate-storyboard', label: 'Generate Storyboard', agent: 'nanobanana' },
       { id: 'generate-video', label: 'Generate Video', agent: 'kling' },
     ]);

     const addTask = (actionId) => {
       const action = availableActions.find(a => a.id === actionId);
       setTemplate({
         ...template,
         tasks: [...template.tasks, {
           id: generateId(),
           action: actionId,
           agent: action.agent,
           dependsOn: [],
           params: {},
         }],
       });
     };

     return (
       <div className="template-builder">
         <div className="builder-header">
           <input
             placeholder="Template Name"
             value={template.name}
             onChange={e => setTemplate({ ...template, name: e.target.value })}
           />
           <textarea
             placeholder="Description"
             value={template.description}
             onChange={e => setTemplate({ ...template, description: e.target.value })}
           />
         </div>

         <div className="builder-canvas">
           <TaskPalette
             actions={availableActions}
             onAdd={addTask}
           />

           <TaskGraph
             tasks={template.tasks}
             onUpdate={tasks => setTemplate({ ...template, tasks })}
           />
         </div>

         <button onClick={saveTemplate}>Save Template</button>
       </div>
     );
   }
   ```

2. **Task Graph Component** (drag-and-drop task ordering):
   ```tsx
   export function TaskGraph({ tasks, onUpdate }) {
     const [nodes, setNodes] = useState(tasks);

     const onDragEnd = (result) => {
       // Reorder tasks
       const newTasks = reorder(nodes, result.source.index, result.destination.index);
       setNodes(newTasks);
       onUpdate(newTasks);
     };

     return (
       <DragDropContext onDragEnd={onDragEnd}>
         <Droppable droppableId="tasks">
           {(provided) => (
             <div ref={provided.innerRef} {...provided.droppableProps}>
               {nodes.map((task, index) => (
                 <Draggable key={task.id} draggableId={task.id} index={index}>
                   {(provided) => (
                     <div
                       ref={provided.innerRef}
                       {...provided.draggableProps}
                       {...provided.dragHandleProps}
                     >
                       <TaskNode
                         task={task}
                         onEdit={editTask}
                         onDelete={deleteTask}
                       />
                     </div>
                   )}
                 </Draggable>
               ))}
               {provided.placeholder}
             </div>
           )}
         </Droppable>
       </DragDropContext>
     );
   }
   ```

3. **Save Template API** (`frontend/src/app/api/workflows/templates/route.ts`):
   ```typescript
   export async function POST(request: NextRequest) {
     const template = await request.json();

     // Validate template structure
     // Save to database
     // Return template ID
   }
   ```

**Files to Create**:
- `frontend/src/app/workflows/templates/new/page.tsx`
- `frontend/src/components/TaskPalette.tsx`
- `frontend/src/components/TaskGraph.tsx`
- `frontend/src/components/TaskNode.tsx`
- `frontend/src/app/api/workflows/templates/route.ts`

**Database Migration**:
```sql
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### Task 15: Asset Library/Browser ⏱️ ~8 hours
**Status**: Not implemented

**Implementation Plan**:

1. **Create Asset Library Page** (`frontend/src/app/assets/page.tsx`):
   ```tsx
   export default function AssetsPage() {
     const [assets, setAssets] = useState([]);
     const [filter, setFilter] = useState({
       type: 'all',
       project: 'all',
       search: '',
     });

     useEffect(() => {
       loadAssets(filter);
     }, [filter]);

     return (
       <div className="assets-page">
         <AssetFilters
           filter={filter}
           onChange={setFilter}
         />

         <AssetGrid
           assets={assets}
           onSelect={handleSelect}
           onDelete={handleDelete}
         />
       </div>
     );
   }
   ```

2. **Asset Grid Component** (`frontend/src/components/AssetGrid.tsx`):
   ```tsx
   export function AssetGrid({ assets, onSelect, onDelete }) {
     return (
       <div className="asset-grid">
         {assets.map(asset => (
           <AssetCard
             key={asset.id}
             asset={asset}
             onClick={() => onSelect(asset)}
             onDelete={() => onDelete(asset.id)}
           />
         ))}
       </div>
     );
   }

   function AssetCard({ asset, onClick, onDelete }) {
     return (
       <div className="asset-card" onClick={onClick}>
         {asset.type === 'image' && <img src={asset.url} />}
         {asset.type === 'video' && <video src={asset.url} />}
         {asset.type === 'audio' && <AudioPlayer src={asset.url} />}

         <div className="asset-info">
           <div className="asset-name">{asset.name}</div>
           <div className="asset-metadata">
             {asset.size} • {asset.created_at}
           </div>
         </div>

         <button onClick={e => { e.stopPropagation(); onDelete(); }}>
           Delete
         </button>
       </div>
     );
   }
   ```

3. **Asset Filters** (`frontend/src/components/AssetFilters.tsx`):
   ```tsx
   export function AssetFilters({ filter, onChange }) {
     return (
       <div className="asset-filters">
         <input
           type="search"
           placeholder="Search assets..."
           value={filter.search}
           onChange={e => onChange({ ...filter, search: e.target.value })}
         />

         <select
           value={filter.type}
           onChange={e => onChange({ ...filter, type: e.target.value })}
         >
           <option value="all">All Types</option>
           <option value="image">Images</option>
           <option value="video">Videos</option>
           <option value="audio">Audio</option>
         </select>

         <select
           value={filter.project}
           onChange={e => onChange({ ...filter, project: e.target.value })}
         >
           <option value="all">All Projects</option>
           {/* Load from projects table */}
         </select>
       </div>
     );
   }
   ```

4. **API Route** (`frontend/src/app/api/assets/route.ts`):
   ```typescript
   export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const type = searchParams.get('type');
     const project = searchParams.get('project');
     const search = searchParams.get('search');

     let query = supabase
       .from('assets')
       .select('*')
       .order('created_at', { ascending: false });

     if (type && type !== 'all') {
       query = query.eq('type', type);
     }

     if (project && project !== 'all') {
       query = query.eq('project_id', project);
     }

     if (search) {
       query = query.ilike('name', `%${search}%`);
     }

     const { data, error } = await query;

     return NextResponse.json({ assets: data });
   }
   ```

**Files to Create**:
- `frontend/src/app/assets/page.tsx`
- `frontend/src/components/AssetGrid.tsx`
- `frontend/src/components/AssetCard.tsx`
- `frontend/src/components/AssetFilters.tsx`
- `frontend/src/app/api/assets/route.ts`

---

## Testing Checklist

After implementing each feature:

- [ ] Feature works in development
- [ ] Rate limiting enforced
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Loading states shown
- [ ] Empty states handled
- [ ] Works with real API keys
- [ ] Data persists correctly
- [ ] No console errors

---

## Priority Recommendations

**Phase 2A (Quick Wins - 1-2 days)**:
1. Re-enable file upload UI
2. Re-enable workflow suggestions UI
3. Replace mock analytics data

**Phase 2B (Major Features - 1-2 weeks)**:
1. NanoBanana UI controls
2. Kling AI video generation UI
3. Provider selection interface

**Phase 2C (Advanced Features - 2-3 weeks)**:
1. Suno music generation UI
2. Workflow template builder
3. Asset library/browser

---

## Additional Notes

- All backend APIs are functional and tested
- Rate limiting is already applied to critical routes
- Provider routing logic exists and works
- Database tables may need to be created (verify with Supabase)
- Consider using existing UI component libraries (shadcn/ui, Radix UI)
- Test with real API keys before deploying

---

*Generated: 2026-01-03*
*Last Updated: 2026-01-03*
