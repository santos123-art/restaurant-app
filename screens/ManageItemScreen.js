
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { decode } from 'base64-arraybuffer';

const ManageItemScreen = ({ navigation, route }) => {
  const itemToEdit = route.params?.item;

  const [name, setName] = useState(itemToEdit?.name || '');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [price, setPrice] = useState(itemToEdit?.price?.toString() || '');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setImage({ uri: itemToEdit.image_url });
    }
  }, [itemToEdit]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // Request base64 for upload
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Erro', 'Nome e preço são campos obrigatórios.');
      return;
    }

    setUploading(true);

    let imageUrl = itemToEdit?.image_url;

    // If a new image was selected, upload it
    if (image && image.base64) {
      try {
        const fileExt = image.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('menu-images') // Make sure you have a bucket named 'menu-images'
          .upload(filePath, decode(image.base64), {
            contentType: `image/${fileExt}`,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;

      } catch (error) {
        console.error("Error uploading image:", error.message);
        Alert.alert('Erro de Upload', 'Não foi possível enviar a imagem.');
        setUploading(false);
        return;
      }
    }

    const itemData = {
      name,
      description,
      price: parseFloat(price),
      image_url: imageUrl,
    };

    let error;

    if (itemToEdit) {
      // Update existing item
      const { error: updateError } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', itemToEdit.id);
      error = updateError;
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from('menu_items')
        .insert(itemData);
      error = insertError;
    }

    if (error) {
      console.error('Error saving item:', error.message);
      Alert.alert('Erro', 'Não foi possível salvar o item.');
    } else {
      Alert.alert('Sucesso', `Item ${itemToEdit ? 'atualizado' : 'criado'} com sucesso!`);
      navigation.goBack();
    }

    setUploading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{itemToEdit ? 'Editar Item' : 'Adicionar Novo Item'}</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>Escolher Imagem</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nome do Prato"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Preço (ex: 19.99)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  imagePickerText: {
    color: '#555',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ManageItemScreen;
