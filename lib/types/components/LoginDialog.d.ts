import React from 'react';
export declare function LoginDialog({ saving, onSubmit, onCancel, }: {
    saving: boolean;
    onSubmit: (key: string) => void;
    onCancel: () => void;
}): React.ReactNode;
export declare function CredentialSaveConfirm({ onConfirm, onDecline, }: {
    onConfirm: () => void;
    onDecline: () => void;
}): React.ReactNode;
export declare function CredentialDeleteConfirm({ onConfirm, onCancel, }: {
    onConfirm: () => void;
    onCancel: () => void;
}): React.ReactNode;
//# sourceMappingURL=LoginDialog.d.ts.map