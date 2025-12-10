'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminDb as firestore } from '@/lib/firebase-admin'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()),
})

export async function createTemplate(data: unknown) {
  const validatedFields = formSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { name, description, permissions } = validatedFields.data
    const docRef = await firestore.collection('accessLevelTemplates').add({
      name,
      description: description || '',
      permissions,
    });
    
    revalidatePath('/access/levels')

    return {
      data: { id: docRef.id, ...validatedFields.data }
    }
  } catch (error) {
    return {
      errors: {
        _form: ['An unexpected error occurred.'],
      },
    }
  }
}

export async function updateTemplate(id: string, data: unknown) {
    const validatedFields = formSchema.safeParse(data)
  
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }
  
    try {
      const { name, description, permissions } = validatedFields.data
      await firestore.collection('accessLevelTemplates').doc(id).update({
        name,
        description: description || '',
        permissions,
      });
      
      revalidatePath('/access/levels')
  
      return {
        data: { id, ...validatedFields.data }
      }
    } catch (error) {
      return {
        errors: {
          _form: ['An unexpected error occurred.'],
        },
      }
    }
  }

  export async function deleteTemplate(id: string) {
    try {
      await firestore.collection('accessLevelTemplates').doc(id).delete();
      
      revalidatePath('/access/levels')
  
      return {
        data: { success: true }
      }
    } catch (error) {
        console.error("Error deleting template: ", error)
      return {
        errors: {
          _form: ['An unexpected error occurred while deleting.'],
        },
      }
    }
  }
