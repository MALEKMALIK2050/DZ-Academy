// src/components/payment-modal.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  I18nManager,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { ThemedText } from '@/components/themed-text';
import { API_ENDPOINTS } from '@/constants/api';
import { DZ_PAYMENT_CONFIG, getClasseLabel, getNiveauLabel, getMatiereLabel } from '@/constants/algerian-education';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  course: {
    id: number | string;
    title?: string;
    titre?: string;
    prix?: number;
    parcoursTotalPrice?: number;
    isFreeTrial?: boolean;
    niveau?: string;
    annee?: string;
    matiere?: string;
  };
  initialType?: 'COURS_SEUL' | 'PARCOURS_COMPLET';
  token: string | null;
  onEnrollmentSuccess?: () => void;
}

export function PaymentModal({
  visible,
  onClose,
  course,
  initialType = 'COURS_SEUL',
  token,
  onEnrollmentSuccess,
}: PaymentModalProps) {
  const [selectedType, setSelectedType] = useState<'COURS_SEUL' | 'PARCOURS_COMPLET'>(initialType);
  const [preuveAsset, setPreuveAsset] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedType(initialType);
      setPreuveAsset(null);
      setSuccessDone(false);
    }
  }, [visible, initialType]);

  const courseTitle = course.title || course.titre || 'الدورة التعليمية';
  const isParcours = selectedType === 'PARCOURS_COMPLET';
  const prixBase = course.prix === 0 ? 0 : (course.prix ?? 500);
  const parcoursTotal = (course.parcoursTotalPrice !== undefined && course.parcoursTotalPrice !== null)
    ? course.parcoursTotalPrice
    : (prixBase > 0 ? prixBase * 4 : 2000);
  const prixParcours = Math.round(parcoursTotal * 0.75);
  const finalPrice = isParcours ? prixParcours : prixBase;

  const matiereLabel = getMatiereLabel(course.matiere);
  const classeLabel = getClasseLabel(course.annee);
  const courseLibelle = isParcours
    ? `المسار الكامل (${matiereLabel || course.matiere || ''} ${classeLabel || course.annee || ''})`
    : courseTitle;

  // ── اختيار صورة من المعرض ──
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه الصلاحية', 'يتطلب التطبيق صلاحية الوصول إلى معرض الصور لرفع وصل الدفع.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        setPreuveAsset({
          uri: a.uri,
          type: a.mimeType || 'image/jpeg',
          name: a.fileName || 'recu_paiement.jpg',
        });
      }
    } catch (err) {
      console.error('pickImage error:', err);
    }
  };

  // ── التقاط صورة بالكاميرا ──
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه الصلاحية', 'يتطلب التطبيق صلاحية استخدام الكاميرا لتصوير وصل الدفع.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        setPreuveAsset({
          uri: a.uri,
          type: a.mimeType || 'image/jpeg',
          name: a.fileName || 'camera_recu.jpg',
        });
      }
    } catch (err) {
      console.error('takePhoto error:', err);
    }
  };

  // ── اختيار ملف PDF ──
  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        setPreuveAsset({
          uri: a.uri,
          type: a.mimeType || 'application/pdf',
          name: a.name || 'recu_paiement.pdf',
        });
      }
    } catch (err) {
      console.error('pickDocument error:', err);
    }
  };

  // ── تأكيد وإرسال طلب التسجيل مع الوصل ──
  const handleConfirmEnrollment = async () => {
    if (!token) {
      Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً لإتمام عملية التسجيل.');
      return;
    }

    setEnrolling(true);
    try {
      // 1. إنشاء أو تحديث التسجيل في الدورة
      const enrollRes = await fetch(API_ENDPOINTS.enrollCourse, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: Number(course.id),
          typePaiement: selectedType,
        }),
      });

      const enrollData = await enrollRes.json();
      if (!enrollRes.ok && enrollRes.status !== 409) {
        throw new Error(enrollData.error || 'تعذر تسجيل طلب الدورة');
      }

      const enrollmentId = enrollData.enrollment?.id || enrollData.id;

      // 2. رفع وصل الدفع إذا تم اختياره
      if (preuveAsset && enrollmentId) {
        setUploading(true);
        const formData = new FormData();
        formData.append('enrollmentId', String(enrollmentId));
        formData.append('courseId', String(course.id));

        if (Platform.OS === 'web') {
          const fetchBlob = await fetch(preuveAsset.uri);
          const blob = await fetchBlob.blob();
          formData.append('preuve', blob, preuveAsset.name);
        } else {
          formData.append('preuve', {
            uri: preuveAsset.uri,
            type: preuveAsset.type,
            name: preuveAsset.name,
          } as any);
        }

        const uploadRes = await fetch(API_ENDPOINTS.uploadPreuve, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          console.warn('Upload preuve failed, but enrollment created');
        }
      }

      setSuccessDone(true);
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess();
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة لاحقاً.');
    } finally {
      setEnrolling(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSuccessDone(false);
    setPreuveAsset(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={pm.overlay} onPress={handleClose} />
      <View style={pm.sheet}>
        {/* رأس النافذة */}
        <View style={pm.header}>
          <Pressable onPress={handleClose} hitSlop={10}>
            <ThemedText style={pm.closeBtn}>✕</ThemedText>
          </Pressable>
          <ThemedText style={pm.headerTitle}>💳 تعليمات الدفع وتأكيد الطلب</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {successDone ? (
            <View style={pm.successBox}>
              <ThemedText style={pm.successIcon}>🎉</ThemedText>
              <ThemedText style={pm.successTitle}>تم استلام طلبك بنجاح !</ThemedText>
              <ThemedText style={pm.successDesc}>
                طلب تسجيلك في الدورة قيد المراجعة من طرف إدارة الأكاديمية. سيتم تفعيل وصولك الكامل فور التحقق من الوصل.
              </ThemedText>
              <Pressable style={pm.successBtn} onPress={handleClose}>
                <ThemedText style={pm.successBtnTxt}>العودة للدورة</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              {/* تفاصيل الدورة */}
              <View style={pm.courseSummary}>
                <ThemedText style={pm.courseTitle} numberOfLines={2}>
                  {courseTitle}
                </ThemedText>
                <View style={pm.courseTags}>
                  {course.matiere && (
                    <View style={pm.tagBadge}>
                      <ThemedText style={pm.tagText}>{matiereLabel || course.matiere}</ThemedText>
                    </View>
                  )}
                  {course.annee && (
                    <View style={pm.tagBadge}>
                      <ThemedText style={pm.tagText}>{classeLabel || course.annee}</ThemedText>
                    </View>
                  )}
                  {course.niveau && (
                    <View style={pm.tagBadge}>
                      <ThemedText style={pm.tagText}>{getNiveauLabel(course.niveau)}</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* اختيار نوع التسجيل (درس فردي أو مسار كامل بخصم 25%) */}
              <ThemedText style={pm.sectionLabel}>📅 اختر نوع التسجيل :</ThemedText>
              <View style={pm.typeRow}>
                {/* خيار الدرس الفردي */}
                <Pressable
                  style={[pm.typeBtn, !isParcours && pm.typeBtnActive]}
                  onPress={() => setSelectedType('COURS_SEUL')}
                >
                  <ThemedText style={[pm.typeBtnTxt, !isParcours && pm.typeBtnTxtActive]}>
                    💳 هذا الدرس
                  </ThemedText>
                  <ThemedText style={[pm.priceTxt, !isParcours && pm.priceTxtActive]}>
                    {prixBase === 0 ? 'مجاني' : `${prixBase} د.ج`}
                  </ThemedText>
                </Pressable>

                {/* خيار المسار الكامل */}
                <Pressable
                  style={[pm.typeBtn, isParcours && pm.typeBtnActive]}
                  onPress={() => setSelectedType('PARCOURS_COMPLET')}
                >
                  <View style={pm.discountBadge}>
                    <ThemedText style={pm.discountBadgeTxt}>خصم 25% 🎉</ThemedText>
                  </View>
                  <ThemedText style={[pm.typeBtnTxt, isParcours && pm.typeBtnTxtActive]}>
                    🎓 المسار الكامل
                  </ThemedText>
                  <ThemedText style={[pm.priceTxt, isParcours && pm.priceTxtActive]}>
                    {prixParcours === 0 ? 'مجاني' : `${prixParcours} د.ج`}
                  </ThemedText>
                </Pressable>
              </View>

              {/* بطاقة السعر الإجمالي المطلوب */}
              <View style={[pm.priceBox, finalPrice === 0 && pm.priceBoxFree]}>
                <View style={pm.priceRow}>
                  <ThemedText style={pm.priceLabel}>المبلغ المطلوب دفعه :</ThemedText>
                  <ThemedText style={[pm.finalPriceText, finalPrice === 0 && pm.finalPriceTextFree]}>
                    {finalPrice > 0 ? `${finalPrice.toLocaleString()} د.ج` : '🎁 هذا الدرس مجاني'}
                  </ThemedText>
                </View>
                <ThemedText style={pm.priceNote}>
                  {isParcours
                    ? 'يشمل جميع دورات المادة لهذه السنة الدراسية مع خصم 25% ووصول كامل'
                    : finalPrice > 0
                    ? 'يشمل الوصول الكامل لجميع فصول واختبارات هذه الدورة التعليمية'
                    : 'يمكنك البدء فوراً بدون دفع أي رسوم'}
                </ThemedText>
              </View>

              {finalPrice > 0 && (
                <>
                  {/* معلومات الدفع بالجزائر */}
                  <ThemedText style={pm.sectionLabel}>💳 معلومات الدفع المتاحة بالجزائر :</ThemedText>

                  {/* بريدي موب */}
                  <View style={pm.infoCard}>
                    <View style={pm.paymentMethodHeader}>
                      <ThemedText style={pm.methodIcon}>⚡</ThemedText>
                      <ThemedText style={pm.methodTitle}>الدفع السريع عبر بريدي موب (BaridiMob)</ThemedText>
                    </View>
                    <ThemedText style={pm.infoRow}>
                      رقم الحساب (RIP) : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.baridimob.rip}</ThemedText>
                    </ThemedText>
                    <ThemedText style={pm.infoRow}>
                      المستفيد : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.baridimob.titulaire}</ThemedText>
                    </ThemedText>
                  </View>

                  {/* بريد الجزائر CCP */}
                  <View style={pm.infoCard}>
                    <View style={pm.paymentMethodHeader}>
                      <ThemedText style={pm.methodIcon}>📮</ThemedText>
                      <ThemedText style={pm.methodTitle}>الدفع عبر الحساب البريدي الجاري (CCP)</ThemedText>
                    </View>
                    <ThemedText style={pm.infoRow}>
                      رقم الحساب : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.ccp.numero} مفتاح {DZ_PAYMENT_CONFIG.ccp.cle}</ThemedText>
                    </ThemedText>
                    <ThemedText style={pm.infoRow}>
                      صاحب الحساب : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.ccp.titulaire}</ThemedText>
                    </ThemedText>
                  </View>

                  {/* التحويل البنكي RIB */}
                  {DZ_PAYMENT_CONFIG.rib && (
                    <View style={pm.infoCard}>
                      <View style={pm.paymentMethodHeader}>
                        <ThemedText style={pm.methodIcon}>🏦</ThemedText>
                        <ThemedText style={pm.methodTitle}>الدفع عبر التحويل البنكي</ThemedText>
                      </View>
                      <ThemedText style={pm.infoRow}>
                        البنك : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.rib.banque}</ThemedText>
                      </ThemedText>
                      <ThemedText style={pm.infoRow}>
                        رقم الحساب (RIB) : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.rib.numero}</ThemedText>
                      </ThemedText>
                      <ThemedText style={pm.infoRow}>
                        صاحب الحساب : <ThemedText style={pm.infoVal}>{DZ_PAYMENT_CONFIG.rib.titulaire}</ThemedText>
                      </ThemedText>
                    </View>
                  )}

                  {/* إرفاق وصل الدفع */}
                  <ThemedText style={pm.sectionLabel}>📎 إرفاق وصل الدفع (صورة أو PDF) :</ThemedText>
                  <View style={pm.uploadBox}>
                    {preuveAsset ? (
                      <View style={pm.previewContainer}>
                        {preuveAsset.type.startsWith('image/') ? (
                          <Image source={{ uri: preuveAsset.uri }} style={pm.previewImg} resizeMode="cover" />
                        ) : (
                          <View style={pm.pdfPreview}>
                            <ThemedText style={{ fontSize: 36, marginBottom: 8 }}>📄</ThemedText>
                            <ThemedText style={pm.pdfName} numberOfLines={2}>{preuveAsset.name}</ThemedText>
                          </View>
                        )}
                        <Pressable style={pm.removeBtn} onPress={() => setPreuveAsset(null)}>
                          <ThemedText style={pm.removeBtnTxt}>✕ إلغاء الملف</ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={pm.uploadBtns}>
                        <Pressable style={pm.uploadBtn} onPress={pickImage}>
                          <ThemedText style={pm.uploadBtnTxt}>🖼️ المعرض</ThemedText>
                        </Pressable>
                        <Pressable style={pm.uploadBtn} onPress={takePhoto}>
                          <ThemedText style={pm.uploadBtnTxt}>📷 الكاميرا</ThemedText>
                        </Pressable>
                        <Pressable style={pm.uploadBtn} onPress={pickDocument}>
                          <ThemedText style={pm.uploadBtnTxt}>📄 ملف PDF</ThemedText>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* خيار إرسال الوصل عبر واتساب */}
                  <View style={pm.waBanner}>
                    <ThemedText style={pm.waLabel}>— أو يمكنك إرسال الوصل مباشرة عبر واتساب —</ThemedText>
                    <TouchableOpacity
                      style={pm.waBtn}
                      onPress={() => {
                        const msg = encodeURIComponent(
                          `السلام عليكم، أود إرسال وصل الدفع الخاص بـ ${courseLibelle} (المبلغ: ${finalPrice} د.ج).`
                        );
                        const phone = (DZ_PAYMENT_CONFIG.whatsapp || '213791713163').replace(/[^0-9]/g, '');
                        const url = `https://wa.me/${phone}?text=${msg}`;
                        Linking.openURL(url);
                      }}
                    >
                      <ThemedText style={pm.waBtnTxt}>💬 إرسال الوصل عبر واتساب</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* زر التأكيد النهائي */}
              <Pressable
                style={[pm.confirmBtn, (enrolling || uploading) && { opacity: 0.6 }]}
                onPress={handleConfirmEnrollment}
                disabled={enrolling || uploading}
              >
                {enrolling || uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={pm.confirmBtnTxt}>
                    {uploading
                      ? 'جاري رفع الوصل...'
                      : finalPrice === 0
                      ? '🎁 تأكيد التسجيل المجاني'
                      : '✅ تأكيد طلب التسجيل'}
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 20,
    color: '#9CA3AF',
    padding: 4,
  },
  courseSummary: {
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 8,
  },
  courseTags: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  typeRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 10,
    marginHorizontal: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  typeBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  typeBtnTxtActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  priceTxt: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  priceTxtActive: {
    color: '#1E40AF',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  priceBox: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  priceBoxFree: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  priceRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  finalPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E40AF',
  },
  finalPriceTextFree: {
    color: '#059669',
  },
  priceNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 16,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentMethodHeader: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  methodIcon: {
    fontSize: 18,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  infoRow: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    marginTop: 2,
  },
  infoVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadBox: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    padding: 14,
    alignItems: 'center',
  },
  uploadBtns: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 8,
    width: '100%',
  },
  uploadBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  uploadBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  previewImg: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  pdfPreview: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pdfName: {
    fontSize: 12,
    color: '#334155',
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  removeBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  waBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  waLabel: {
    fontSize: 11,
    color: '#166534',
  },
  waBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  waBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  confirmBtn: {
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E40AF',
  },
  confirmBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  successBox: {
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  successBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default PaymentModal;
