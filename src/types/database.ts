export type Album = {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    client_greeting: string | null;
    status: 'draft' | 'published' | 'archived';
    current_review_cycle: number;
    created_at: string;
    updated_at: string;
    watermark_text: string;
};

export type Profile = {
    id: string;
    clerk_user_id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    updated_at: string;
}; 