package com.connecthub.connecthub.service;

import com.connecthub.connecthub.dto.CommentResponse;
import com.connecthub.connecthub.dto.UserSummary;
import com.connecthub.connecthub.model.Comment;
import com.connecthub.connecthub.model.Post;
import com.connecthub.connecthub.model.CommentLike;
import com.connecthub.connecthub.model.User;
import com.connecthub.connecthub.repository.CommentLikeRepository;
import com.connecthub.connecthub.repository.CommentRepository;
import com.connecthub.connecthub.repository.PostRepository;
import com.connecthub.connecthub.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
            PostRepository postRepository,
            NotificationService notificationService,
            CommentLikeRepository commentLikeRepository,
            UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.notificationService = notificationService;
        this.commentLikeRepository = commentLikeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponse addComment(Long postId, String text, String email) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorEmail(email);
        comment.setText(text);

        Comment saved = commentRepository.save(comment);

        notificationService.createNotification(
                post.getAuthorEmail(),
                email,
                "COMMENT",
                postId);

        return mapAllToResponse(List.of(saved), email).get(0);
    }

    @Transactional
    public CommentResponse addReply(Long postId, Long parentCommentId, String text, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));

        Comment reply = new Comment();
        reply.setPostId(postId);
        reply.setParentCommentId(parentCommentId);
        reply.setAuthorEmail(email);
        reply.setText(text);

        Comment saved = commentRepository.save(reply);

        if (!parent.getAuthorEmail().equals(email)) {
            notificationService.createNotification(
                    parent.getAuthorEmail(),
                    email,
                    "COMMENT_REPLY",
                    postId);
        }

        return mapAllToResponse(List.of(saved), email).get(0);
    }

    @Transactional
    public void likeComment(Long commentId, String email) {
        if (commentLikeRepository.existsByCommentIdAndUserEmail(commentId, email)) {
            return;
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        CommentLike like = new CommentLike();
        like.setCommentId(commentId);
        like.setUserEmail(email);
        commentLikeRepository.save(like);

        comment.setLikesCount(comment.getLikesCount() + 1);
        commentRepository.save(comment);

        if (!comment.getAuthorEmail().equals(email)) {
            notificationService.createNotification(
                    comment.getAuthorEmail(),
                    email,
                    "COMMENT_LIKE",
                    comment.getPostId());
        }
    }

    @Transactional
    public void unlikeComment(Long commentId, String email) {
        if (commentLikeRepository.existsByCommentIdAndUserEmail(commentId, email)) {
            commentLikeRepository.deleteByCommentIdAndUserEmail(commentId, email);

            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new RuntimeException("Comment not found"));
            comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
            commentRepository.save(comment);
        }
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId, String email) {
        List<Comment> comments = commentRepository.findByPostId(postId);
        return mapAllToResponse(comments, email);
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (comment.getAuthorEmail().equals(email)
                || post.getAuthorEmail().equals(email)) {
            commentRepository.delete(comment);
        } else {
            throw new RuntimeException("Not authorized");
        }
    }

    public List<CommentResponse> mapAllToResponse(List<Comment> comments, String currentEmail) {
        if (comments == null || comments.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> authorEmails = comments.stream()
                .map(Comment::getAuthorEmail)
                .collect(Collectors.toSet());
        Map<String, User> userMap = userRepository.mapByEmail(authorEmails);

        Set<Long> likedCommentIds = new HashSet<>();
        if (currentEmail != null) {
            List<Long> commentIds = comments.stream()
                    .map(Comment::getId)
                    .collect(Collectors.toList());
            likedCommentIds = new HashSet<>(commentLikeRepository.findLikedCommentIds(currentEmail, commentIds));
        }

        List<CommentResponse> result = new ArrayList<>(comments.size());
        for (Comment comment : comments) {
            CommentResponse response = new CommentResponse();
            response.setId(comment.getId());
            response.setPostId(comment.getPostId());
            response.setAuthorEmail(comment.getAuthorEmail());
            response.setText(comment.getText());
            response.setCreatedAt(comment.getCreatedAt());
            response.setParentCommentId(comment.getParentCommentId());
            response.setLikesCount(comment.getLikesCount());
            response.setLiked(currentEmail != null && likedCommentIds.contains(comment.getId()));

            User author = userMap.get(comment.getAuthorEmail());
            if (author != null) {
                UserSummary summary = new UserSummary();
                summary.setId(author.getId());
                summary.setUsername(author.getUsername());
                summary.setEmail(author.getEmail());
                summary.setProfileImage(author.getProfileImage());
                response.setAuthor(summary);
            }

            result.add(response);
        }
        return result;
    }
}
