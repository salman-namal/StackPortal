export interface Stat { label: string; value: string; change: string; tone: 'blue' | 'green' | 'violet' | 'amber'; icon: 'users' | 'folder' | 'check-square' | 'bar-chart'; points: string; }
export interface Project { name: string; code: string; owner: string; initials: string; status: 'Completed' | 'Running' | 'Pending'; progress: number; deadline: string; }
export interface Member { name: string; role: string; initials: string; status: 'Online' | 'Offline' | 'Busy'; color: string; }
export interface Activity { title: string; detail: string; time: string; type: 'project' | 'user' | 'task' | 'payment' | 'system'; }
