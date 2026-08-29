import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Teacher } from '../types';

const avatarThemes = [
  'bg-red-100 text-red-800 ring-red-200',
  'bg-amber-100 text-amber-800 ring-amber-200',
  'bg-emerald-100 text-emerald-800 ring-emerald-200',
  'bg-blue-100 text-blue-800 ring-blue-200',
  'bg-violet-100 text-violet-800 ring-violet-200',
];

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) || 'GV').toLocaleUpperCase('vi-VN');
};

const themeFor = (seed: string) => avatarThemes[[...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % avatarThemes.length];

interface TeacherAvatarProps {
  teacher: Pick<Teacher, 'name' | 'avatar'>;
  className?: string;
  imageClassName?: string;
}

/** A resilient avatar: an optional photo is used when available; otherwise a
 * consistent, accessible initials badge keeps staff cards visually complete. */
export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({ teacher, className = 'h-12 w-12', imageClassName = '' }) => {
  const [isPhotoUnavailable, setIsPhotoUnavailable] = useState(false);
  // Teacher records currently do not support photo uploads. Only use an image
  // that is part of this app (or an uploaded data URL); legacy remote links
  // are deliberately replaced by the stable initials badge.
  const isTrustedPhoto = Boolean(teacher.avatar?.startsWith('/') || teacher.avatar?.startsWith('data:'));
  const canShowPhoto = Boolean(isTrustedPhoto && !isPhotoUnavailable);

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold ring-2 ${themeFor(teacher.name)} ${className}`}
      aria-label={`Ảnh đại diện giáo viên ${teacher.name}`}
      title={teacher.name}
    >
      {canShowPhoto ? (
        <img
          src={teacher.avatar}
          alt=""
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setIsPhotoUnavailable(true)}
          referrerPolicy="no-referrer"
        />
      ) : teacher.name.trim() ? (
        <span aria-hidden="true">{initialsOf(teacher.name)}</span>
      ) : (
        <GraduationCap className="h-1/2 w-1/2" aria-hidden="true" />
      )}
    </div>
  );
};
