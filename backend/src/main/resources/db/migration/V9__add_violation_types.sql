DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'violations' AND column_name = 'type'
    LOOP
        EXECUTE 'ALTER TABLE violations DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE violations ADD CONSTRAINT violations_type_check CHECK (type IN (
    'TAB_SWITCH', 'WINDOW_BLUR', 'COPY', 'PASTE', 'RIGHT_CLICK',
    'SCREEN_SHARE_STOP', 'VM_DETECTION', 'DEVTOOLS_OPEN', 'MULTI_MONITOR', 'KEYBOARD_SHORTCUT', 'WEBCAM_DISCONNECT'
));
