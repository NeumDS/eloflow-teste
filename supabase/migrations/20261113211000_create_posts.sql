CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('person', 'company')),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX posts_created_at_idx
ON public.posts (created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar publicações.
CREATE POLICY "posts_read"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Só permite criar publicação vinculada ao próprio perfil.
CREATE POLICY "posts_insert"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND (
        (
            author_type = 'person'
            AND EXISTS (
                SELECT 1
                FROM public.candidates c
                WHERE c.id = author_id
                AND lower(c.email) = lower((SELECT auth.jwt() ->> 'email'))
            )
        )
        OR
        (
            author_type = 'company'
            AND EXISTS (
                SELECT 1
                FROM public.companies c
                WHERE c.id = author_id
                AND lower(c.email) = lower((SELECT auth.jwt() ->> 'email'))
            )
        )
    )
);

-- Só permite editar a própria publicação.
CREATE POLICY "posts_update"
ON public.posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Só permite excluir a própria publicação.
CREATE POLICY "posts_delete"
ON public.posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());