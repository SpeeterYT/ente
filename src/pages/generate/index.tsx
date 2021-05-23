import React, { useState, useEffect } from 'react';
import constants from 'utils/strings/constants';
import { logoutUser, putAttributes } from 'services/userService';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { useRouter } from 'next/router';
import { getKey, SESSION_KEYS } from 'utils/storage/sessionStorage';
import {
    setSessionKeys,
    generateAndSaveIntermediateKeyAttributes,
    generateKeyAttributes,
} from 'utils/crypto';
import SetPasswordForm from 'components/SetPasswordForm';
import { setJustSignedUp } from 'utils/storage';
import RecoveryKeyModal from 'components/RecoveryKeyModal';
import { KeyAttributes } from 'types';

export interface KEK {
    key: string;
    opsLimit: number;
    memLimit: number;
}

export default function Generate(props) {
    const [token, setToken] = useState<string>();
    const router = useRouter();
    const [recoverModalView, setRecoveryModalView] = useState(false);

    useEffect(() => {
        props.setLoading(true);
        const key = getKey(SESSION_KEYS.ENCRYPTION_KEY);
        const keyAttributes: KeyAttributes = getData(
            LS_KEYS.ORIGINAL_KEY_ATTRIBUTES
        );
        router.prefetch('/gallery');
        const user = getData(LS_KEYS.USER);
        if (!user?.token) {
            router.push('/');
            return;
        }
        setToken(user.token);
        if (keyAttributes?.encryptedKey) {
            const main = async () => {
                try {
                    await putAttributes(user.token, keyAttributes);
                } catch (e) {
                    //ignore
                }
                setData(LS_KEYS.ORIGINAL_KEY_ATTRIBUTES, null);
                setRecoveryModalView(true);
            };
            main();
        } else if (key) {
            router.push('/gallery');
        }
        props.setLoading(false);
    }, []);

    const onSubmit = async (passphrase, setFieldError) => {
        try {
            const { keyAttributes, masterKey } = await generateKeyAttributes(
                passphrase
            );

            await putAttributes(token, keyAttributes);
            await generateAndSaveIntermediateKeyAttributes(
                passphrase,
                keyAttributes,
                masterKey
            );
            await setSessionKeys(masterKey);
            setJustSignedUp(true);
            setRecoveryModalView(true);
        } catch (e) {
            console.error(e);
            setFieldError('passphrase', constants.PASSWORD_GENERATION_FAILED);
        }
    };

    return (
        <>
            {!recoverModalView && (
                <SetPasswordForm
                    callback={onSubmit}
                    buttonText={constants.SET_PASSPHRASE}
                    back={logoutUser}
                />
            )}
            <RecoveryKeyModal
                show={recoverModalView}
                onHide={() => {
                    setRecoveryModalView(false);
                    router.push('/gallery');
                }}
                somethingWentWrong={() => null}
            />
        </>
    );
}
