export interface SlideDetails {
    folderName: string
    bulletPoints: string[]
    slides: string[]
}

export interface UrlItem {
    id: string
    url: string
    label: string
    type: 'youtube' | 'doc' | 'github' | 'other'
}

export interface FormState {
    type: 'long' | 'short'
    title: string
    topic: string
    hook?: string
    notes?: string
    presentationReady: boolean
    slideDetails: SlideDetails
    urls: UrlItem[]
    status: string
    scheduledDate: string
    videoVariant: string
}

export type Action =
    | { type: 'SET_FIELD'; field: keyof FormState; value: any }
    | { type: 'ADD_URL'; payload: UrlItem }
    | { type: 'REMOVE_URL'; payload: string }
    | { type: 'ADD_BULLET_POINT'; payload: string }
    | { type: 'REMOVE_BULLET_POINT'; index: number }
    | { type: 'ADD_SLIDE'; payload: string }
    | { type: 'REMOVE_SLIDE'; index: number }
    | { type: 'SET_SLIDE_FIELD'; field: keyof SlideDetails; value: any }
