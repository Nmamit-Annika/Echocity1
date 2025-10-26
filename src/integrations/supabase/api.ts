import { supabase } from './client'
import { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type UserRole = Database['public']['Tables']['user_roles']['Row']
type Department = Database['public']['Tables']['departments']['Row']

export const profiles = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async upsert(profile: ProfileUpdate & { id: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const roles = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    return data
  },
  async assign(userId: string, role: 'admin' | 'citizen') {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async remove(userId: string, role: 'admin' | 'citizen') {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)
    
    if (error) throw error
  }
}

export const stats = {
  async complaintsCount(userId: string) {
    const { count, error } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (error) throw error
    return count ?? 0
  }
}

export const departments = {
  async list() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async create(name: string, description?: string) {
    const { data, error } = await supabase
      .from('departments')
      .insert({ name, description })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: { name?: string; description?: string }) {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}