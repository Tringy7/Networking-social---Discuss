package com.discuss.discuss.service.auth;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
@AllArgsConstructor
public class UserDetails implements UserDetailsService  {
    private final UserRepository userRepository;

    @Override
    public org.springframework.security.core.userdetails.UserDetails loadUserByUsername (String username)  throws UsernameNotFoundException {
        User user  = this.userRepository.findByUsername(username);
        if (user == null ) {
            throw  new  UsernameNotFoundException ( "No user found with this name " + username);
        }
        return  new  org.springframework.security.core.userdetails.User (
                user.getUsername(),
                user.getPassword(),
                Collections.emptyList()
        );
    }
}
