// Simple in-memory database for development
interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: Date;
}

interface Project {
  id: number;
  user_id: number;
  name: string;
  canvas_state: any;
  image_id?: string;
  thumbnail?: string;
  created_at: Date;
  updated_at: Date;
}

const users: User[] = [];
const projects: Project[] = [];
let userIdCounter = 1;
let projectIdCounter = 1;

export const db = {
  query: async (text: string, params: any[] = []) => {
    // Simple query parser for in-memory database
    const lowerText = text.toLowerCase();

    if (lowerText.includes('insert into users')) {
      const [email, password, name] = params;
      const user: User = {
        id: userIdCounter++,
        email,
        password,
        name,
        created_at: new Date()
      };
      users.push(user);
      return { rows: [user] };
    }

    if (lowerText.includes('select') && lowerText.includes('from users')) {
      if (lowerText.includes('where email')) {
        const email = params[0];
        const found = users.filter(u => u.email === email);
        return { rows: found };
      }
      if (lowerText.includes('where id')) {
        const id = params[0];
        const found = users.filter(u => u.id === id);
        return { rows: found };
      }
    }

    if (lowerText.includes('insert into projects')) {
      const [user_id, name, canvas_state, image_id] = params;
      const project: Project = {
        id: projectIdCounter++,
        user_id,
        name,
        canvas_state,
        image_id,
        created_at: new Date(),
        updated_at: new Date()
      };
      projects.push(project);
      return { rows: [project] };
    }

    if (lowerText.includes('select') && lowerText.includes('from projects')) {
      if (lowerText.includes('where id') && lowerText.includes('and user_id')) {
        const [id, user_id] = params;
        const found = projects.filter(p => p.id === parseInt(id) && p.user_id === parseInt(user_id));
        return { rows: found };
      }
      if (lowerText.includes('where user_id')) {
        const user_id = params[0];
        const found = projects.filter(p => p.user_id === parseInt(user_id));
        return { rows: found };
      }
    }

    if (lowerText.includes('update projects')) {
      const [name, canvas_state, id, user_id] = params;
      const index = projects.findIndex(p => p.id === parseInt(id) && p.user_id === parseInt(user_id));
      if (index >= 0) {
        projects[index].name = name;
        projects[index].canvas_state = canvas_state;
        projects[index].updated_at = new Date();
        return { rows: [projects[index]] };
      }
      return { rows: [] };
    }

    if (lowerText.includes('delete from projects')) {
      const [id, user_id] = params;
      const index = projects.findIndex(p => p.id === parseInt(id) && p.user_id === parseInt(user_id));
      if (index >= 0) {
        projects.splice(index, 1);
      }
      return { rows: [] };
    }

    return { rows: [] };
  }
};

export const initDatabase = async () => {
  console.log('✅ Using in-memory database');
};
