// ... (keep your imports the same)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const imageUrls: string[] = [];
      // 1. Upload Images (This usually works fine even on slow net)
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `items/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('ITEM-PHOTOS').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('ITEM-PHOTOS').getPublicUrl(filePath);
        imageUrls.push(publicUrl);
      }

      // 2. Save Item
      const { data: newItem, error: dbError } = await supabase
        .from('items')
        .insert([{
            title, description, price: parseFloat(price), category,
            image_urls: imageUrls, status: 'payment_pending',
            created_at: new Date().toISOString(),
        }])
        .select().single();

      if (dbError) throw dbError;

      // 3. SECURE CHECKOUT FETCH (With dedicated timeout)
      console.log("Attempting to reach Stripe API...");
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 45000); // Give it a full 45 seconds

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: newItem.id, itemTitle: title }),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to respond");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No URL returned from Stripe");
      }

    } catch (error: any) {
      console.error('Detailed Error:', error);
      if (error.name === 'AbortError') {
        alert('Connection timed out. Your item was saved as "Pending". Please check your internet and try again.');
      } else {
        alert(`Issue: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };
