import Editor from "@/modules/tiptap-editor/components/TiptapEditor";
import type { EditorOption } from "@/modules/tiptap-editor/components/editor-options";
import { defaultTiptapOptions } from "@/modules/tiptap-editor/components/editor-options";
import { refs } from "@/lib/nx-firestore-refs";
import { collection, doc, getDocs, query } from "firebase/firestore";
import React, { useEffect, useReducer, useMemo } from "react";

// Infer the props type from the component itself
type EditorProps = React.ComponentProps<typeof Editor>;

interface Preset {
  id: string;
  name: string;
  content?: string;
  settings?: {
    toolbar?: { key: string; active: boolean }[];
  };
}

interface State {
    presets: Preset[] | null;
    defaultToolbarOptions: EditorOption[] | null;
    error: string | null;
}

type Action =
    | { type: 'SET_DATA'; payload: { presets: Preset[], defaultToolbarOptions: EditorOption[] } }
    | { type: 'RESET' }
    | { type: 'SET_ERROR'; payload: string };

const initialState: State = {
    presets: null,
    defaultToolbarOptions: null,
    error: null,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, presets: action.payload.presets, defaultToolbarOptions: action.payload.defaultToolbarOptions };
        case 'RESET':
            return initialState;
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

// Create a map for quick icon lookup
const iconMap = new Map(defaultTiptapOptions.map(opt => [opt.key, opt.icon]));

export const SmartRichTextEditor = ({
    defaultEditorModuleId,
    instanceId,
    ...editorProps
}: {
    defaultEditorModuleId?: string | null;
    instanceId: string;
} & Omit<EditorProps, 'activeOptions'>) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (!defaultEditorModuleId) {
            dispatch({ type: 'RESET' });
            return;
        }

        const fetchPresets = async () => {
            try {
                const tiptapModuleRef = doc(refs.instance.modulesDoc(instanceId), 'tiptap-editor');
                const presetsRef = collection(tiptapModuleRef, 'presets');
                const presetsQuery = query(presetsRef);
                const snapshot = await getDocs(presetsQuery);
                const presets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Preset[];

                const defaultPreset = presets.find(p => p.id === defaultEditorModuleId);
                
                // CORREÇÃO: Mapeia as opções do preset e adiciona o 'icon' a partir do `iconMap`
                const defaultToolbarOptions: EditorOption[] = (defaultPreset?.settings?.toolbar || []).map(opt => ({
                    ...opt,
                    icon: iconMap.get(opt.key) || 'HelpCircle', // Adiciona o ícone ou um ícone padrão
                }));
                
                dispatch({ type: 'SET_DATA', payload: { presets, defaultToolbarOptions }});

            } catch (e) {
                console.error(e);
                dispatch({ type: 'SET_ERROR', payload: "Failed to load editor presets." });
            }
        };

        fetchPresets();

    }, [defaultEditorModuleId, instanceId]);

    const isLoading = state.defaultToolbarOptions === null && !!defaultEditorModuleId;

    if (isLoading) {
        return <div>Loading Editor...</div>;
    }

    if (state.error) {
        return <div>Error: {state.error}</div>;
    }
    
    return (
        <Editor
            {...editorProps}
            activeOptions={state.defaultToolbarOptions || []}
        />
    );
};
