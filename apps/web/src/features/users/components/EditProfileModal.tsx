import { zodResolver } from '@hookform/resolvers/zod';
import {
  type UpdateProfileInput,
  type UploadKind,
  updateProfileSchema,
  type UserProfile,
} from '@twitter-clone/shared';
import { Camera, X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { FormError } from '@/features/auth/components/FormError';
import { withTransform } from '@/lib/cloudinary';
import { applyApiErrors } from '@/lib/form';
import { cropImage, validateImageFile } from '@/lib/images';

import { uploadImage, useUpdateProfile } from '../api';
import { ImageCropper } from './ImageCropper';

const CROP_CONFIG = {
  avatar: { aspect: 1, shape: 'round', output: { width: 400, height: 400 } },
  banner: { aspect: 3, shape: 'rect', output: { width: 1500, height: 500 } },
} as const;

// Estado de cada imagem no modal:
// undefined = não mexeu | Blob = nova imagem recortada | null = removida
type PendingImages = Partial<Record<UploadKind, Blob | null>>;

type Cropping = { kind: UploadKind; src: string; area: Area | null };

type EditProfileModalProps = { profile: UserProfile; open: boolean; onClose: () => void };

export function EditProfileModal({ profile, open, onClose }: EditProfileModalProps) {
  const [cropping, setCropping] = useState<Cropping | null>(null);

  function closeCropper() {
    if (cropping) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cropping ? 'Editar mídia' : 'Editar perfil'}
      variant="compact"
      onBack={cropping ? closeCropper : undefined}
      headerAction={
        cropping ? (
          <Button
            variant="inverse"
            size="sm"
            form="crop-form"
            type="submit"
            disabled={!cropping.area}
          >
            Aplicar
          </Button>
        ) : (
          <Button variant="inverse" size="sm" form="edit-profile-form" type="submit">
            Salvar
          </Button>
        )
      }
    >
      <EditProfileForm
        profile={profile}
        onSaved={onClose}
        cropping={cropping}
        onStartCrop={(kind, src) => setCropping({ kind, src, area: null })}
        onCropAreaChange={(area) => setCropping((c) => (c ? { ...c, area } : c))}
        onCropDone={closeCropper}
      />
    </Modal>
  );
}

type EditProfileFormProps = {
  profile: UserProfile;
  onSaved: () => void;
  cropping: Cropping | null;
  onStartCrop: (kind: UploadKind, src: string) => void;
  onCropAreaChange: (area: Area) => void;
  onCropDone: () => void;
};

// Fica montado durante o recorte (só escondido), para não perder o que já foi digitado.
function EditProfileForm({
  profile,
  onSaved,
  cropping,
  onStartCrop,
  onCropAreaChange,
  onCropDone,
}: EditProfileFormProps) {
  const updateProfile = useUpdateProfile();
  const [images, setImages] = useState<PendingImages>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const previews = useObjectUrls(images);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name,
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      website: profile.website ?? '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const input: UpdateProfileInput = { ...data };
      // sobe as imagens novas primeiro; só depois salva o perfil com as URLs
      for (const kind of ['avatar', 'banner'] as const) {
        const image = images[kind];
        if (image === undefined) continue;
        input[`${kind}Url`] = image === null ? null : await uploadImage(image, kind);
      }
      await updateProfile.mutateAsync(input);
      onSaved();
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  function pickFile(kind: UploadKind, file: File | undefined) {
    if (!file) return;
    const error = validateImageFile(file);
    setImageError(error);
    if (!error) onStartCrop(kind, URL.createObjectURL(file));
  }

  async function applyCrop(event: FormEvent) {
    event.preventDefault();
    if (!cropping?.area) return;
    try {
      const blob = await cropImage(cropping.src, cropping.area, CROP_CONFIG[cropping.kind].output);
      setImages((current) => ({ ...current, [cropping.kind]: blob }));
      onCropDone();
    } catch {
      setImageError('Não foi possível recortar a imagem.');
      onCropDone();
    }
  }

  const bannerSrc = images.banner === null ? null : (previews.banner ?? profile.bannerUrl);
  const avatarSrc = images.avatar === null ? null : (previews.avatar ?? profile.avatarUrl);

  return (
    <>
      {cropping && (
        <form id="crop-form" onSubmit={applyCrop}>
          <ImageCropper
            key={cropping.src}
            src={cropping.src}
            aspect={CROP_CONFIG[cropping.kind].aspect}
            shape={CROP_CONFIG[cropping.kind].shape}
            onAreaChange={onCropAreaChange}
          />
        </form>
      )}

      <form
        id="edit-profile-form"
        onSubmit={onSubmit}
        noValidate
        hidden={cropping !== null}
        aria-busy={isSubmitting}
        className="pb-16"
      >
        <fieldset disabled={isSubmitting} className="contents">
          {/* Banner */}
          <div className="relative aspect-[3/1] bg-surface">
            {bannerSrc && (
              <img
                src={withTransform(bannerSrc, 'c_fill,w_1500,h_500,q_auto,f_auto')}
                alt=""
                className="size-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/30">
              <ImagePickerButton
                label="Alterar banner"
                onPick={(file) => pickFile('banner', file)}
              />
              {bannerSrc && (
                <button
                  type="button"
                  aria-label="Remover banner"
                  onClick={() => setImages((current) => ({ ...current, banner: null }))}
                  className="rounded-full bg-black/60 p-3 hover:bg-black/40"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="relative -mt-12 ml-4 size-28 overflow-hidden rounded-full border-4 border-background bg-surface">
            {avatarSrc && (
              <img
                src={withTransform(avatarSrc, 'c_fill,w_400,h_400,q_auto,f_auto')}
                alt=""
                className="size-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <ImagePickerButton
                label="Alterar avatar"
                onPick={(file) => pickFile('avatar', file)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 px-4 pt-4">
            <FormError message={imageError ?? errors.root?.server?.message} />
            {(errors.avatarUrl || errors.bannerUrl) && (
              <FormError message="Não foi possível salvar a imagem. Tente outra." />
            )}

            <TextField
              label="Nome"
              maxLength={50}
              error={errors.name?.message}
              {...register('name')}
            />
            <TextAreaField
              label="Bio"
              maxLength={160}
              defaultValue={profile.bio ?? ''}
              error={errors.bio?.message}
              {...register('bio')}
            />
            <TextField
              label="Localização"
              maxLength={30}
              error={errors.location?.message}
              {...register('location')}
            />
            <TextField
              label="Site"
              type="url"
              inputMode="url"
              maxLength={100}
              error={errors.website?.message}
              {...register('website')}
            />
          </div>
        </fieldset>
      </form>
    </>
  );
}

function ImagePickerButton({ label, onPick }: { label: string; onPick: (file?: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-black/60 p-3 hover:bg-black/40"
      >
        <Camera className="size-5" />
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        className="hidden"
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = ''; // permite escolher o mesmo arquivo de novo
        }}
      />
    </>
  );
}

// URLs temporárias (blob:) para pré-visualizar as imagens recortadas, liberadas ao trocar/fechar.
function useObjectUrls(images: PendingImages) {
  const urls = useMemo(() => {
    const next: Partial<Record<UploadKind, string>> = {};
    for (const kind of ['avatar', 'banner'] as const) {
      const image = images[kind];
      if (image) next[kind] = URL.createObjectURL(image);
    }
    return next;
  }, [images]);

  useEffect(() => () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url)), [urls]);

  return urls;
}
